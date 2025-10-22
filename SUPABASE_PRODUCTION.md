# 🔧 Supabase Edge Function Production Setup

## Edge Function Deployment Status

### Current Configuration
- **Function Name**: `send-weather-emails`
- **Project**: `uflvdccamhbgaqnbygfw`
- **Function URL**: `https://uflvdccamhbgaqnbygfw.supabase.co/functions/v1/send-weather-emails`

## 🚀 Production Deployment Steps

### 1. Deploy Edge Function to Supabase
```bash
# Login to Supabase (if not already logged in)
supabase login

# Deploy the Edge Function
npx supabase functions deploy send-weather-emails --no-verify-jwt --project-ref uflvdccamhbgaqnbygfw
```

### 2. Set Environment Variables in Supabase Dashboard

**Important**: The Resend API key must be set in Supabase Dashboard, not GitHub secrets.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/uflvdccamhbgaqnbygfw)
2. Navigate to **Edge Functions** → **Environment Variables**
3. Add the following environment variable:

```
RESEND_API_KEY=re_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej
```

### 3. Test Edge Function Deployment
```bash
# Test the deployed function
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  "https://uflvdccamhbgaqnbygfw.supabase.co/functions/v1/send-weather-emails"
```

## 📋 Edge Function Features

The deployed function includes:

✅ **Email Consolidation Logic**
- Groups subscriptions by email + send_time
- Creates single emails for multiple locations

✅ **Fresh Weather Data Fetching**
- Calls Open-Meteo API before each send
- No caching - always current data

✅ **Dashboard-Style Email Template**
- Dark theme matching frontend UI
- Metric cards for each location
- Comprehensive 14-day forecast tables

✅ **Error Handling & Logging**
- Graceful error handling for API failures
- Detailed logging for debugging

## 🔍 Verification Checklist

### Edge Function Health Check
- [ ] Function responds to POST requests
- [ ] Authentication works with service role key
- [ ] Environment variables are set correctly
- [ ] Email sending works through Resend API

### GitHub Actions Integration
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret is configured
- [ ] Email automation workflow runs successfully
- [ ] Function is triggered every 5 minutes
- [ ] Logs show successful execution

### Email Delivery Testing
- [ ] Test emails are delivered successfully
- [ ] Multi-location emails are properly consolidated
- [ ] Dashboard styling renders correctly in email clients
- [ ] Footer analytics tables display properly

## 🛠️ Manual Deployment Commands

If you need to redeploy:

```bash
# Navigate to project directory
cd /Users/gabrielrios/Desktop/ET/weather-app

# Deploy Edge Function
supabase functions deploy send-weather-emails --no-verify-jwt

# Or deploy with specific project reference
supabase functions deploy send-weather-emails --no-verify-jwt --project-ref uflvdccamhbgaqnbygfw
```

## 🔐 Environment Variables Required

### Supabase Edge Function Environment
```env
RESEND_API_KEY=re_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej
```

### GitHub Actions Environment
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
```

## 📊 Monitoring

### Edge Function Logs
1. Go to Supabase Dashboard → Edge Functions
2. Select `send-weather-emails`
3. View logs and invocation history

### GitHub Actions Logs
1. Go to GitHub repository → Actions
2. Select "Email Automation" workflow
3. View execution logs and status

## 🚨 Troubleshooting

### Function Not Responding
- Check if function is deployed: View in Supabase Dashboard
- Verify environment variables are set
- Check authentication headers in requests

### Email Not Sending
- Verify `RESEND_API_KEY` in Supabase environment variables
- Check Resend dashboard for delivery status
- Review Edge Function logs for errors

### GitHub Actions Failing
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in GitHub secrets
- Check that service role key has proper permissions
- Verify function URL is accessible

---

🎯 **Your Edge Function is production-ready with consolidated email delivery!**