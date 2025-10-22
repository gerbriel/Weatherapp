# 🚀 Supabase Email Automation Setup Guide

This guide will help you set up automated weather emails using Supabase Edge Functions with Resend API for reliable email delivery and minute-level precision scheduling.

## 📋 Prerequisites

- Supabase project: `https://uflvdccamhbgaqnbygfw.supabase.co`
- Resend account (for email sending service) - **Much better than EmailJS!**
- GitHub repository with secrets access

## 🗄️ Step 1: Set Up Database Schema

1. **Open Supabase SQL Editor**
   - Go to https://app.supabase.com/project/uflvdccamhbgaqnbygfw/sql/new
   
2. **Run the Schema**
   - Copy the contents of `supabase-schema.sql`
   - Paste and execute in the SQL editor
   - This creates tables: `email_subscriptions`, `email_send_logs`, `weather_locations`

## 📧 Step 2: Configure Resend (Much Better than EmailJS!)

### Why Resend?
- ✅ **No personal email required** - uses professional domains
- ✅ **Higher reliability** - server-side API, not browser-dependent
- ✅ **Better deliverability** - emails don't go to spam
- ✅ **More generous free tier** - 3,000 emails/month vs 200
- ✅ **Professional appearance** - from `weather@resend.dev`

### Setup Steps:

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up for free account

2. **Get API Key**
   - Go to Dashboard → API Keys
   - Click "Create API Key"
   - Copy your key (starts with `re_`)

3. **Choose From Email**
   - **Option 1**: Use `weather@resend.dev` (no setup required)
   - **Option 2**: Add your own domain (advanced users)

**That's it!** No templates, no SMTP, no personal email configuration needed!

## 🔧 Step 3: Configure Supabase Edge Function

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   supabase login
   ```

2. **Link Project**
   ```bash
   cd /path/to/weather-app
   supabase link --project-ref uflvdccamhbgaqnbygfw
   ```

3. **Set Environment Variables in Supabase**
   Go to Project Settings > Edge Functions > Environment Variables:
   ```
   RESEND_API_KEY=re_your_api_key_here
   FROM_EMAIL=weather@resend.dev
   ```

4. **Deploy Edge Function**
   ```bash
   supabase functions deploy send-weather-emails
   ```

## ⏰ Step 4: Set Up Automated Scheduling

1. **Enable pg_cron Extension**
   Go to Database > Extensions, enable `pg_cron`

2. **Create Cron Job**
   In SQL Editor, run:
   ```sql
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

   Replace `YOUR_SERVICE_ROLE_KEY` with your service role key from Project Settings > API.

## 🔐 Step 5: Configure GitHub Secrets

Add these secrets in GitHub repository settings (Settings > Secrets and variables > Actions):

```
VITE_SUPABASE_URL=https://uflvdccamhbgaqnbygfw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbHZkY2NhbWhiZ2FxbmJ5Z2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODEyNjMsImV4cCI6MjA3NjY1NzI2M30.GkHxIZvHsijAgfCGdCHZgYu58pTUy8UGGhIpFwJKu4I
```

**Note**: Email credentials are now configured in Supabase Edge Functions environment variables, not GitHub secrets. This is more secure!

## 🧪 Step 6: Test the System

1. **Add a Location**
   - Use the app to add a weather location

2. **Create Email Subscription**
   - Go to Email Reports tab
   - Create a test subscription (set it for a few minutes in the future)
   - Choose recurring or one-time
   - Select locations

3. **Verify Database**
   - Check `email_subscriptions` table for your subscription
   - Verify `next_send_at` is calculated correctly

4. **Monitor Logs**
   - Watch `email_send_logs` table for send attempts
   - Check Edge Function logs in Supabase dashboard

## ✨ Features You Now Have

### 🎯 **Precise Scheduling**
- **Minute-level precision**: Schedule emails down to the exact minute
- **Multiple timezones**: Each subscription can use different timezone
- **Recurring vs One-time**: Choose weekly recurring or specific date/time

### 🤖 **True Automation**
- **24/7 Operation**: Runs on Supabase servers, not user's browser
- **Reliable Delivery**: Cron job checks every minute for due emails
- **Failure Handling**: Logs errors and retries automatically

### 📊 **Advanced Management**
- **Subscription Tracking**: View next send times and history
- **Location Selection**: Choose specific locations per subscription  
- **Enable/Disable**: Turn subscriptions on/off without deleting
- **Send Logs**: Track all email attempts and results

## 🔍 Troubleshooting

### **Edge Function Not Working**
- Check environment variables are set in Supabase
- Verify function deployment: `supabase functions list`
- Check function logs in Supabase dashboard

### **Emails Not Sending**
- Verify Resend API key is correct in Supabase environment variables
- Check `email_send_logs` table for error messages  
- Test Resend API key with curl command
- Ensure FROM_EMAIL is valid (weather@resend.dev works without setup)

### **Cron Job Issues**
- Verify pg_cron extension is enabled
- Check cron job exists: `SELECT * FROM cron.job;`
- Ensure service role key has proper permissions

### **GitHub Deployment**
- Verify all secrets are set correctly
- Check Actions tab for build errors
- Ensure environment variables load during build

## 🎉 Success!

Your weather app now has:
- ✅ Automated recurring emails (weekly on specific day/time)
- ✅ One-time scheduled emails (specific date/time)  
- ✅ Minute-level precision scheduling
- ✅ Multiple timezone support
- ✅ Reliable server-side automation
- ✅ Comprehensive logging and error handling
- ✅ GitHub Pages deployment with secrets

The system will automatically send weather reports to subscribers based on their preferences, even when no one is using the app!