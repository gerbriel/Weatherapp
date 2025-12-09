import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Make request to CIMIS API
    const cmisResponse = await fetch(cmisUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!cmisResponse.ok) {
      const errorText = await cmisResponse.text();
      console.error('CIMIS API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `CIMIS API error: ${cmisResponse.status}`,
          details: errorText
        }),
        { 
          status: cmisResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the response data
    const data = await cmisResponse.json();

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
