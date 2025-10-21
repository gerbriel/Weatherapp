# Supabase Edge Function for automated weather email sending

This function runs on Supabase Edge runtime and handles:
- Checking for subscriptions due for sending
- Fetching weather data from Open Meteo API  
- Sending formatted emails via EmailJS
- Logging send attempts and updating schedules

## Environment Variables Required:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- EMAILJS_SERVICE_ID
- EMAILJS_TEMPLATE_ID  
- EMAILJS_PUBLIC_KEY

## Deployment:
```bash
supabase functions deploy send-weather-emails
```

## Scheduling:
Set up a cron job in Supabase Dashboard to call this function every minute:
```sql
SELECT cron.schedule(
  'send-weather-emails',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://uflvdccamhbgaqnbygfw.supabase.co/functions/v1/send-weather-emails',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
  );
  $$
);
```