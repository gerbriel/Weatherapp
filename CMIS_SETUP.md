# 🔐 CMIS API Key Setup Guide

This guide shows you how to securely integrate your CMIS API key without exposing it in your public repository.

## Quick Setup (5 minutes)

### Step 1: Get Your CMIS API Key
1. Visit: https://cimis.water.ca.gov/WSNReportCriteria.aspx
2. Register for an account if needed
3. Request API access and get your API key

### Step 2: Add to Local Environment
1. Open `.env.local` in your project root
2. Add your key:
   ```bash
   REACT_APP_CMIS_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### Step 3: Restart Development Server
```bash
npm run dev
```

### Step 4: Verify Setup
- Check browser console for "🔧 Environment Configuration Status"
- Look for "CMIS API Key: ✅ Configured"
- Reports should now show real ETC data instead of mock data

## ✅ What's Already Secured

- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ Environment validator checks for proper setup
- ✅ Graceful fallback to mock data if API key missing
- ✅ Production deployment variables documented
- ✅ Security best practices implemented

## 🚀 Production Deployment

### Vercel
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `REACT_APP_CMIS_API_KEY` = `your_key`

### Netlify
1. Netlify Dashboard → Site Settings → Environment Variables
2. Add: `REACT_APP_CMIS_API_KEY` = `your_key`

### Other Platforms
Check `docs/DEPLOYMENT_SECURITY.md` for platform-specific instructions.

## 🔍 Troubleshooting

### API Key Not Working
- Check console for validation messages
- Verify key is active on CIMIS website
- Ensure no extra spaces in `.env.local`

### Still Seeing Mock Data
- Restart development server after adding key
- Check browser console for error messages
- Verify key format and permissions

### Security Concerns
- Never commit `.env.local` to git
- Use different keys for development/production
- Monitor API usage for unusual activity

## 📱 Testing

To test the integration:
1. Go to Reports tab
2. Check "ETC Actual" column in forecast table
3. Should show real values instead of "—"
4. Console should log "Fetching real CMIS data for station X"

## 🛠 Advanced Configuration

You can also customize the CMIS API base URL:
```bash
REACT_APP_CMIS_BASE_URL=https://api.cimis.water.ca.gov/api/data
```

This is optional - the default URL will be used if not specified.