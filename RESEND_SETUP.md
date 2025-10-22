# Resend API Setup Guide

## Quick Setup

1. **Get API Key from Resend**:
   - Visit: https://resend.com
   - Sign up/Login
   - Go to API Keys → Create API Key
   - Copy the key (starts with `re_`)

2. **Update .env file**:
   ```bash
   # Replace 'your_resend_api_key_here' with your actual key
   VITE_RESEND_API_KEY=re_your_actual_key_here
   VITE_FROM_EMAIL=weather@resend.dev
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## What This Enables

✅ **Email Analytics** - View comprehensive email delivery stats
✅ **Resend Integration** - Real-time email tracking in admin panel  
✅ **Delivery Metrics** - Bounce rates, open rates, click tracking
✅ **Email History** - Recent email logs and status updates

## Troubleshooting

- **API Key Format**: Must start with `re_`
- **Environment**: Restart dev server after changing .env
- **Permissions**: Ensure API key has email sending permissions

## Free Tier Limits

- **100 emails/day** on free plan
- **3,000 emails/month** total
- Perfect for testing and small projects