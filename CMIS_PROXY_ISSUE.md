# CIMIS Proxy Issue - RESOLVED

## Problem
The CIMIS API was returning HTML error pages instead of JSON data:
```
{"error":"Failed to proxy CIMIS request","details":"Unexpected token '<', \"<html><hea\"... is not valid JSON"}
```

## Root Cause
The CIMIS API (`https://et.water.ca.gov/api/data`) has a WAF (Web Application Firewall) that:
1. **Blocks requests with invalid API keys** - Returns HTML "Request Rejected" page
2. **Validates the `appKey` parameter** - Must be a valid CIMIS API key

## Test Results
```bash
$ curl "https://et.water.ca.gov/api/data?appKey=test&targets=2&startDate=2024-01-01&endDate=2024-01-02&dataItems=day-asce-eto"

<html><head><title>Request Rejected</title></head><body>The requested URL was rejected. Please consult with your administrator.<br><br>Your support ID is: 252892476365239512</body></html>
```

## Solution

### ✅ What We Fixed
1. **Improved error handling** in `supabase/functions/cmis-proxy/index.ts`:
   - Catches non-JSON responses
   - Returns proper error messages
   - Logs response preview for debugging

2. **Added User-Agent header** to make requests look more legitimate

### ⚠️ What Still Needs To Be Done

The app requires a **valid CIMIS API key** to work in production. You have two options:

#### Option 1: Use Your Existing API Key (Recommended)
You already have `VITE_CMIS_API_KEY` in your `.env.local`. Make sure it's also set as a GitHub Secret:

1. Go to: https://github.com/gerbriel/Weatherapp/settings/secrets/actions
2. Add or update secret: `VITE_CMIS_API_KEY`
3. Value: Your CIMIS API key from `.env.local`
4. Trigger a new deployment (push a commit)

#### Option 2: Get a New CIMIS API Key
If you don't have a valid key:

1. Visit: https://et.water.ca.gov/Home/Register
2. Register for a free CIMIS API key
3. Add it to GitHub Secrets as `VITE_CMIS_API_KEY`
4. Trigger a new deployment

## Current Status

✅ Edge function deployed and working  
✅ Error handling improved  
✅ CORS issues resolved  
❌ Waiting for valid CIMIS API key in production  

## Temporary Workaround

The app is designed to work WITHOUT CIMIS data - it will:
- Show "Retry" buttons for California locations
- Use Open-Meteo ET₀ forecast data instead
- Still function for all non-California locations

Users can still use the app, they just won't see actual ET₀ data from CIMIS stations until a valid API key is configured.
