# 🔐 GitHub Secrets Setup Checklist

## Required Repository Secrets

Before deploying to GitHub, configure these secrets in your repository:

**Repository Settings → Secrets and variables → Actions → New repository secret**

### ✅ Frontend Deployment Secrets

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `VITE_SUPABASE_URL` | `https://uflvdccamhbgaqnbygfw.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...` | Your Supabase anonymous key |

### ✅ Email Automation Secrets

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...` | Service role key for GitHub Actions |

## 🔍 How to Find Your Keys

### Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **uflvdccamhbgaqnbygfw**
3. Navigate to Settings → API
4. Copy the required keys:
   - **Project URL**: `VITE_SUPABASE_URL`
   - **anon public**: `VITE_SUPABASE_ANON_KEY` 
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Resend API Key (Edge Function Environment)
The Resend API key (`re_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej`) should be set as an environment variable in Supabase, not GitHub:

1. Go to Supabase Dashboard → Edge Functions
2. Navigate to Environment Variables
3. Add: `RESEND_API_KEY=re_Y8QJJ4f6_LAzk7qfPPZv9ZL1kfQZnhsej`

## ⚡ Quick Setup Commands

### 1. GitHub CLI (if you have it installed)
```bash
# Set frontend secrets
gh secret set VITE_SUPABASE_URL -b "https://uflvdccamhbgaqnbygfw.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY -b "your_anon_key_here"

# Set automation secret
gh secret set SUPABASE_SERVICE_ROLE_KEY -b "your_service_role_key_here"
```

### 2. Manual Setup via GitHub Web Interface
1. Go to `https://github.com/[username]/[repository]/settings/secrets/actions`
2. Click "New repository secret"
3. Add each secret from the table above

## 🧪 Testing Your Setup

### Verify Frontend Secrets
```bash
# This should build successfully after secrets are set
git push origin main
# Check GitHub Actions tab for build status
```

### Verify Email Automation Secret
```bash
# Go to Actions → Email Automation → Run workflow
# Check the logs for "✅ All required secrets are configured"
```

## 🚨 Security Reminders

- ✅ **Never commit** `.env` files to the repository
- ✅ **Service role key** is only for GitHub Actions (never frontend)
- ✅ **Anon key** is safe for frontend (public)
- ✅ **Resend key** goes in Supabase environment (not GitHub secrets)

## 🔄 After Setup

Once all secrets are configured:

1. **Frontend deployment** happens automatically on push to main
2. **Email automation** runs every 5 minutes via GitHub Actions
3. **Edge functions** use Supabase environment variables for Resend API

---

📋 **Checklist Complete? → Push to main and watch the magic happen!** ✨