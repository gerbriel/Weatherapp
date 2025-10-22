# Supabase Edge Function for Automated Weather Email Sending

This function runs on Supabase Edge runtime and handles:
- Checking for subscriptions due for sending (minute-level precision)
- Fetching weather data from Open Meteo API  
- Sending formatted emails via Resend API
- Logging send attempts and updating schedules
- Calculating next send times for recurring subscriptions

## Environment Variables Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key)
- `RESEND_API_KEY` - API key from resend.com
- `FROM_EMAIL` - From email address (e.g., weather@resend.dev)

## Setup Steps:

### 1. Get Resend API Key
1. Sign up at https://resend.com
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)

### 2. Set Environment Variables in Supabase
Go to Project Settings → Edge Functions → Environment Variables:
```
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=weather@resend.dev
```

### 3. Deploy Function
```bash
supabase functions deploy send-weather-emails
```

### 4. Set Up Cron Job
In Supabase SQL Editor, enable pg_cron and schedule:
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule to run every minute
SELECT cron.schedule(
  'send-weather-emails-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://uflvdccamhbgaqnbygfw.supabase.co/functions/v1/send-weather-emails',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## Features:
- ✅ **Minute-level precision scheduling**
- ✅ **Reliable Resend API integration**
- ✅ **Professional email formatting**
- ✅ **Automatic retry for recurring emails**
- ✅ **Comprehensive error logging**
- ✅ **Multi-location weather reports**