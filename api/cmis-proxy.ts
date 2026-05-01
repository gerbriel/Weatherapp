// Vercel serverless CIMIS proxy — avoids CORS and Supabase IP blocks
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { appKey, targets, startDate, endDate, dataItems, unitOfMeasure } = req.query;

    if (!appKey || !targets || !startDate || !endDate || !dataItems) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const cmisUrl = new URL('https://et.water.ca.gov/api/data');
    cmisUrl.searchParams.set('appKey', String(appKey));
    cmisUrl.searchParams.set('targets', String(targets));
    cmisUrl.searchParams.set('startDate', String(startDate));
    cmisUrl.searchParams.set('endDate', String(endDate));
    cmisUrl.searchParams.set('dataItems', String(dataItems));
    if (unitOfMeasure) {
      cmisUrl.searchParams.set('unitOfMeasure', String(unitOfMeasure));
    }

    const cmisResponse = await fetch(cmisUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; WeatherApp/1.0)',
      },
    });

    if (!cmisResponse.ok) {
      const errorText = await cmisResponse.text();
      return res.status(cmisResponse.status).json({
        error: `CIMIS API error: ${cmisResponse.status}`,
        details: errorText.substring(0, 200),
      });
    }

    const contentType = cmisResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      const body = await cmisResponse.text();
      console.error('CIMIS non-JSON response:', cmisResponse.status, body.substring(0, 500));
      return res.status(502).json({
        error: 'CIMIS returned non-JSON response (likely an error page)',
        details: body.substring(0, 300),
      });
    }

    const data = await cmisResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('CIMIS proxy error:', error);
    return res.status(500).json({
      error: 'Failed to proxy CIMIS request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
