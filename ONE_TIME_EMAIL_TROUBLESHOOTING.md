# 🔧 One-Time Email Setup Guide

## Issue: One-Time Emails Not Sending Immediately

If one-time emails are not sending immediately, here are the most likely causes and solutions:

### 1. **Environment Variables Missing** ⚠️

Create a `.env` file in the project root with your Supabase credentials:

```bash
# Copy from .env.example and fill in your values
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get these values:**
1. Go to your Supabase project dashboard
2. Go to Settings → API
3. Copy the Project URL and anon/public key

### 2. **Email Function Environment** 🔧

The Supabase email function needs these environment variables:
- `SUPABASE_URL` (same as above)
- `SUPABASE_SERVICE_ROLE_KEY` (service role, not anon key)
- `RESEND_API_KEY` (your Resend API key)
- `FROM_EMAIL` (your verified sender email)

Set these in Supabase Dashboard → Edge Functions → send-weather-emails → Settings

### 3. **How One-Time Emails Work** 📧

1. **User Action**: User fills out one-time email form and clicks "Send Now"
2. **Database Insert**: Creates subscription with `is_recurring: false` and `scheduled_at` set to 30 seconds ago
3. **Database Trigger**: Automatically sets `next_send_at = scheduled_at` (in the past)
4. **Immediate Trigger**: Frontend attempts to trigger email function immediately
5. **Scheduled Pickup**: If immediate trigger fails, scheduled function picks it up within minutes

### 4. **Troubleshooting Steps** 🔍

#### Step 1: Check Environment Variables
Use the "Check Environment" button in the Email Debug Tools section to verify your variables are set.

#### Step 2: Check Subscriptions
Use the "Check Subscriptions" button to see if your one-time subscription was created and what its status is.

#### Step 3: Manual Function Trigger
Use the "Trigger Email Function" button to manually call the email sending function.

#### Step 4: Check Supabase Logs
1. Go to Supabase Dashboard → Edge Functions → send-weather-emails
2. Check the "Logs" tab for any errors
3. Look for entries showing your subscription being processed

### 5. **Expected Behavior** ✅

When working correctly:
- ✅ Form submission creates subscription immediately
- ✅ Success message appears: "Weather report sent successfully to {email}!"
- ✅ Email arrives within 1-2 minutes
- ✅ Console logs show successful function trigger

### 6. **Common Issues** ❌

**Issue**: "Subscription created successfully, but immediate sending is not configured"
- **Cause**: Missing `.env` file with Supabase credentials
- **Fix**: Create `.env` file with correct values

**Issue**: Email function returns 400/500 error
- **Cause**: Missing environment variables in Supabase function
- **Fix**: Set all required variables in Supabase Edge Functions settings

**Issue**: Email created but never sent
- **Cause**: Scheduled function not running or misconfigured
- **Fix**: Check Supabase function deployment and environment variables

### 7. **Testing Checklist** ✅

- [ ] `.env` file exists with correct Supabase URL and anon key
- [ ] Supabase function has all environment variables set
- [ ] Weather locations are loaded and have data
- [ ] Email address is valid format
- [ ] At least one location is selected
- [ ] Console shows successful subscription creation
- [ ] Debug tools show environment is configured
- [ ] Debug tools can trigger function successfully

### 8. **Contact Info** 📞

If issues persist after following this guide:
1. Check browser console for detailed error messages
2. Check Supabase function logs for server-side errors
3. Use the Email Debug Tools to gather diagnostic information