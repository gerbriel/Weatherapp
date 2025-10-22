# 🔐 Security Setup Guide

## 🚨 IMMEDIATE ACTION REQUIRED

GitGuardian has detected exposed API keys in your repository. Follow these steps to secure your application immediately.

## 📋 Quick Security Checklist

### 1. 🔑 Rotate Your API Keys (URGENT)
Your exposed Resend API key needs to be rotated:

1. **Login to Resend Dashboard**: https://resend.com/dashboard
2. **Navigate to API Keys**
3. **Delete the exposed key**: `re_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej`
4. **Generate a new API key**
5. **Update your environment variables with the new key**

### 2. 🔧 Set Up GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `VITE_SUPABASE_URL` | `https://uflvdccamhbgaqnbygfw.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ0eXAiOiJKV1Q...` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ0eXAiOiJKV1Q...` | Service role key for backend operations |

### 3. 🌐 Set Up Supabase Edge Function Environment

For the email automation to work:

1. **Go to Supabase Dashboard** → Your Project → Edge Functions
2. **Navigate to Environment Variables**
3. **Add these variables**:
   ```
   RESEND_API_KEY=your_new_resend_api_key
   FROM_EMAIL=weather@resend.dev
   ```

### 4. 🔍 Find Your Keys

#### Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **uflvdccamhbgaqnbygfw**
3. Settings → API:
   - **Project URL**: Copy for `VITE_SUPABASE_URL`
   - **anon public**: Copy for `VITE_SUPABASE_ANON_KEY`
   - **service_role**: Copy for `SUPABASE_SERVICE_ROLE_KEY`

## ⚡ Quick Setup Commands

### Option 1: GitHub CLI
```bash
# Navigate to your repository directory
cd /path/to/your/weather-app

# Set the secrets (replace with your actual values)
gh secret set VITE_SUPABASE_URL -b "https://uflvdccamhbgaqnbygfw.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY -b "your_anon_key_here"
gh secret set SUPABASE_SERVICE_ROLE_KEY -b "your_service_role_key_here"
```

### Option 2: Manual Setup
1. Go to: `https://github.com/[username]/[repository]/settings/secrets/actions`
2. Click "New repository secret"
3. Add each secret from the table above

## 🧪 Test Your Setup

### 1. Test Local Development
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your actual values (DO NOT commit this file)
# Only add RESEND_API_KEY and FROM_EMAIL for local testing

# Test the application
npm run dev
```

### 2. Test Production Deployment
```bash
# Push to trigger deployment
git add .
git commit -m "Security: Remove hardcoded API keys"
git push origin main

# Check GitHub Actions tab for deployment status
```

### 3. Test Email Automation
1. Go to your GitHub repository
2. Actions → Email Automation → Run workflow
3. Check logs for: "✅ All required secrets are configured"

## 🛡️ Security Best Practices

### ✅ DO
- Use GitHub Secrets for sensitive data in CI/CD
- Use Supabase Environment Variables for Edge Functions
- Keep `.env` files in `.gitignore`
- Rotate API keys regularly
- Use different keys for development/production

### ❌ DON'T
- Commit `.env` files to git
- Hardcode API keys in source code
- Share API keys in documentation
- Use production keys in development

## 🔄 Post-Setup Verification

Once configured, your application will:

1. **✅ Build successfully** on push to main
2. **✅ Deploy automatically** to GitHub Pages
3. **✅ Send emails** via automated workflows
4. **✅ Pass security scans** without exposed secrets

## 📞 Need Help?

If you encounter issues:

1. **Check GitHub Actions logs** for build errors
2. **Verify all secrets are set** in repository settings
3. **Test locally** with `.env` file first
4. **Check Supabase logs** for Edge Function errors

## 🔄 Next Steps

After securing your app:

1. Monitor GitGuardian for any remaining issues
2. Set up automated security scanning
3. Review and rotate keys quarterly
4. Document your security procedures

---

**🔒 Remember: Security is not a one-time setup - it's an ongoing practice!**