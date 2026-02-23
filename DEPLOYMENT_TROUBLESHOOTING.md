# GitHub Pages Deployment Troubleshooting

## Current Setup Status

✅ **Simplified Deployment Workflow**: Separated static site deployment from Supabase deployment  
✅ **Environment Variable Validation**: Added checks to ensure secrets are properly set  
✅ **SPA Routing Support**: Added 404.html redirect for single-page application routing  
✅ **Error Handling**: Improved logging and error detection in workflows  

## GitHub Repository Settings Required

### 1. Enable GitHub Pages
Navigate to: **Repository** → **Settings** → **Pages**

**Source**: Deploy from a branch  
**Branch**: `gh-pages` (auto-created by GitHub Actions)  
**Folder**: `/ (root)`

### 2. Required Repository Secrets
Navigate to: **Repository** → **Settings** → **Secrets and variables** → **Actions**

| Secret Name | Required | Purpose |
|-------------|----------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Optional | For Supabase CLI operations |
| `RESEND_API_KEY` | ⚠️ Optional | For email functionality |

## Deployment Workflows

### Main Deployment (deploy.yml)
- **Trigger**: Push to main branch
- **Purpose**: Build React app and deploy to GitHub Pages
- **Dependencies**: Only requires Supabase URL and anon key

### Supabase Deployment (supabase-deploy.yml)  
- **Trigger**: Manual or changes to supabase/ folder
- **Purpose**: Deploy database migrations and edge functions
- **Dependencies**: Requires SUPABASE_SERVICE_ROLE_KEY

## Troubleshooting Steps

### If Build Fails:
1. Check GitHub Actions logs for specific error messages
2. Verify all required secrets are set correctly
3. Ensure secrets don't have extra spaces or characters
4. Check if repository has GitHub Pages enabled

### If Site Loads but Shows Errors:
1. Check browser console for JavaScript errors
2. Verify environment variables are loaded (check production logs)
3. Ensure Supabase project is accessible and properly configured

### If 404 Errors on Refresh:
1. Verify 404.html is created in deployment
2. Check that .nojekyll file exists
3. Ensure GitHub Pages is set to serve from correct branch

## Expected Deployment URL

Your app should be available at:
**https://gerbriel.github.io/Weatherapp/**

## Manual Deployment Test

To test deployment manually:
```bash
# Build locally
npm run build

# Serve locally to test
npx serve dist -s
```

## Next Steps

1. ✅ Push completed - workflows are now simplified
2. 🔄 Check GitHub Actions tab for build status
3. 🔄 Verify GitHub Pages is enabled in repository settings
4. 🔄 Check deployed site URL once Actions complete