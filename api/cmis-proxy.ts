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
    // API key: prefer server-side env var; fall back to client-provided header
    // (The key is already in the browser JS bundle via VITE_CMIS_API_KEY, so
    //  passing it in a header doesn't meaningfully reduce security.)
    const apiKey =
      process.env.VITE_CMIS_API_KEY ||
      process.env.CMIS_API_KEY ||
      req.headers['x-cimis-key'] as string || null;

    const { stationNbrs, targets, startDate, endDate, dataItems, unitOfMeasure } = req.query;
    const stationParam = stationNbrs || targets; // accept both for backwards compat

    if (!apiKey) {
      return res.status(500).json({ error: 'CIMIS API key not configured. Set VITE_CMIS_API_KEY in Vercel env vars.' });
    }
    if (!stationParam || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters: stationNbrs, startDate, endDate' });
    }

    const cmisUrl = new URL('https://et.water.ca.gov/StationWeb/GetDataByStationNumber');
    cmisUrl.searchParams.set('stationNbrs', String(stationParam));
    cmisUrl.searchParams.set('startDate', String(startDate));
    cmisUrl.searchParams.set('endDate', String(endDate));
    cmisUrl.searchParams.set('isHourly', 'false');
    cmisUrl.searchParams.set('dataItems', dataItems ? String(dataItems) : 'day-asce-eto');
    cmisUrl.searchParams.set('unitOfMeasure', unitOfMeasure ? String(unitOfMeasure) : 'E');

    const cmisResponse = await fetch(cmisUrl.toString(), {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
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
