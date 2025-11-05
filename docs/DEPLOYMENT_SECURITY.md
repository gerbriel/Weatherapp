# Production Deployment Security Guide

## Vercel Deployment
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add these variables:
   - `REACT_APP_CMIS_API_KEY` = your_actual_cmis_key
   - `REACT_APP_CMIS_BASE_URL` = https://api.cimis.water.ca.gov/api/data

## Netlify Deployment
1. Go to your Netlify dashboard
2. Select your site
3. Go to Site settings > Environment variables
4. Add the same variables as above

## GitHub Actions (if using CI/CD)
1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Add Repository secrets:
   - `REACT_APP_CMIS_API_KEY`
   - `REACT_APP_CMIS_BASE_URL`

## Railway/Render Deployment
Add environment variables in their respective dashboards following similar patterns.

## Security Best Practices
- ✅ Never commit `.env.local` to git
- ✅ Use `.env.example` for documentation
- ✅ Rotate API keys regularly
- ✅ Use different keys for development/production
- ✅ Monitor API key usage for unusual activity
- ❌ Never hardcode keys in source code
- ❌ Never share keys in chat/email
- ❌ Never include keys in screenshots