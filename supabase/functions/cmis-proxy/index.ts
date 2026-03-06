import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// CIMIS API Proxy - Handles CORS and proxies requests to California CIMIS API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Retry helper with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
      const response = await fetchWithTimeout(url, options, 12000);
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`CIMIS attempt ${attempt + 1} failed: ${lastError.message}`);
    }
  }
  throw lastError;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get query parameters from the request
    const appKey = url.searchParams.get('appKey');
    const targets = url.searchParams.get('targets');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const dataItems = url.searchParams.get('dataItems');
    const unitOfMeasure = url.searchParams.get('unitOfMeasure');

    // Validate required parameters
    if (!appKey || !targets || !startDate || !endDate || !dataItems) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build CIMIS API URL
    const cmisUrl = new URL('https://et.water.ca.gov/api/data');
    cmisUrl.searchParams.set('appKey', appKey);
    cmisUrl.searchParams.set('targets', targets);
    cmisUrl.searchParams.set('startDate', startDate);
    cmisUrl.searchParams.set('endDate', endDate);
    cmisUrl.searchParams.set('dataItems', dataItems);
    if (unitOfMeasure) {
      cmisUrl.searchParams.set('unitOfMeasure', unitOfMeasure);
    }

    console.log('Proxying CIMIS request:', cmisUrl.toString());

    // Make request to CIMIS API — retry up to 3 times on network errors
    const cmisResponse = await fetchWithRetry(cmisUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (compatible; WeatherApp/1.0)',
        'Referer': 'https://cimis.water.ca.gov/',
      },
    });

    if (!cmisResponse.ok) {
      const errorText = await cmisResponse.text();
      console.error('CIMIS API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `CIMIS API error: ${cmisResponse.status}`,
          details: errorText.substring(0, 200)
        }),
        { 
          status: cmisResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the response data - handle non-JSON responses
    const responseText = await cmisResponse.text();
    
    // Check if response is JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('CIMIS returned non-JSON response:', responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          error: 'CIMIS API returned invalid response',
          details: 'Expected JSON but received HTML or plain text. The CIMIS API may be unavailable or blocking requests.',
          preview: responseText.substring(0, 200)
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the data with CORS headers
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to proxy CIMIS request',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
