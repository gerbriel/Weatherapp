# 🚀 GitHub Deployment Guide

This guide covers deploying the Weather App to GitHub Pages with automated email functionality via GitHub Actions.

## 📋 Prerequisites

1. **GitHub Repository** - Push your code to a GitHub repository
2. **Supabase Project** - Active project with Edge Functions deployed
3. **Resend Account** - For email sending functionality

## 🔐 Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these repository secrets:

### Frontend Deployment Secrets
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Email Automation Secrets
```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Resend Integration (for Edge Functions)
```
RESEND_API_KEY=re_your_resend_api_key_here
```

## 🏗️ GitHub Actions Workflows

The repository includes two workflows:

### 1. Frontend Deployment (`deploy.yml`)
- **Triggers**: Push to main branch, pull requests
- **Purpose**: Builds and deploys the React app to GitHub Pages
- **Required Secrets**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 2. Email Automation (`email-automation.yml`)
- **Triggers**: Every 5 minutes (cron schedule) + manual dispatch
- **Purpose**: Triggers the Supabase Edge Function for weather email sending
- **Required Secrets**: `SUPABASE_SERVICE_ROLE_KEY`

## 📦 Deployment Steps

### Step 1: Configure GitHub Pages
1. Go to Repository → Settings → Pages
2. Set Source to "GitHub Actions"
3. The deploy.yml workflow will handle the rest

### Step 2: Add Repository Secrets
Go to Repository → Settings → Secrets and variables → Actions:

```bash
# Frontend secrets (required for build)
VITE_SUPABASE_URL: https://uflvdccamhbgaqnbygfw.supabase.co
VITE_SUPABASE_ANON_KEY: eyJ...your_anon_key

# Backend automation (required for email sending)
SUPABASE_SERVICE_ROLE_KEY: eyJ...your_service_role_key
```

### Step 3: Deploy Supabase Edge Functions
```bash
# Make sure your Edge Function is deployed with environment variables
npx supabase functions deploy send-weather-emails --no-verify-jwt

# Set the Resend API key in Supabase Dashboard
# Go to Project Settings → Edge Functions → Environment Variables
RESEND_API_KEY=re_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej
```

### Step 4: Enable GitHub Actions
1. The workflows are already configured
2. Push to main branch to trigger deployment
3. Check Actions tab for build status

## 🌐 Live URLs

After successful deployment:
- **Frontend**: `https://[username].github.io/[repository-name]`
- **Edge Function**: `https://uflvdccamhbgaqnbygfw.supabase.co/functions/v1/send-weather-emails`

## 🔧 Environment Variables Reference

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://uflvdccamhbgaqnbygfw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Supabase Edge Function Environment
```env
RESEND_API_KEY=re_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej
```

## 📧 Email Automation Features

The deployed system includes:
- ✅ **Consolidated emails** - Multiple locations in one email for same send time
- ✅ **Fresh weather data** - API calls made right before sending
- ✅ **Dashboard styling** - Dark theme matching the app UI
- ✅ **Comprehensive analytics** - 14-day forecast tables for all locations
- ✅ **Dynamic scheduling** - Respects user-selected send times
- ✅ **Automated triggers** - Runs every 5 minutes via GitHub Actions

## 🚨 Security Notes

1. **Never commit .env files** - Already in .gitignore
2. **Use repository secrets** - Never hardcode API keys in workflows
3. **Service role key** - Only used in GitHub Actions, never exposed to frontend
4. **Resend API key** - Stored securely in Supabase environment variables

## 🛠️ Manual Testing

### Test Frontend Deployment
```bash
# Local build test (should match production)
npm run build
npm run preview
```

### Test Email Automation
```bash
# Manual trigger in GitHub Actions
# Go to Actions → Email Automation → Run workflow
```

## 📊 Monitoring

### Build Status
- Check GitHub Actions tab for deployment status
- Frontend builds should complete in ~2-3 minutes

### Email Automation
- View logs in GitHub Actions → Email Automation
- Check Supabase Edge Function logs in dashboard
- Monitor email delivery in Resend dashboard

## 🔄 Continuous Deployment

The system is configured for continuous deployment:
1. **Push to main** → Triggers frontend deployment
2. **Every 5 minutes** → Checks for scheduled emails
3. **Manual dispatch** → Allows immediate email processing

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs for build errors
2. Verify all secrets are properly configured
3. Confirm Supabase Edge Function deployment
4. Test Resend API key functionality

---

🎉 **Your weather app is now ready for production with automated email delivery!**