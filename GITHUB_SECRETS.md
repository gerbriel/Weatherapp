# 🔐 GitHub Repository Secrets Configuration

This project requires the following GitHub repository secrets to be configured for automatic deployment and functionality.

## Required Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Supabase Configuration
| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abcdefghijk.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsIn...` |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access token for deployments | Get from [Supabase CLI](https://supabase.com/dashboard/account/tokens) |

### Email Configuration  
| Secret Name | Description | Example |
|-------------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for email functionality | `re_AbCdEfGh_123456789` |

## How to Get These Values

### Supabase Secrets
1. **VITE_SUPABASE_URL**: Go to your [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API → Project URL
2. **VITE_SUPABASE_ANON_KEY**: Same page → Project → Settings → API → `anon` `public` key
3. **SUPABASE_ACCESS_TOKEN**: Go to [Account Tokens](https://supabase.com/dashboard/account/tokens) → Generate new token

### Resend API Key
1. **RESEND_API_KEY**: Go to [Resend Dashboard](https://resend.com/api-keys) → Create API Key

## Security Best Practices

✅ **DO:**
- Set all sensitive keys as GitHub repository secrets
- Use placeholder values in `.env` and `.env.example`
- Keep the `.env` file in `.gitignore`
- Use different keys for development and production

❌ **DON'T:**
- Commit real API keys to the repository
- Share API keys in chat, email, or documentation
- Use production keys in development
- Store keys in code comments

## Local Development Setup

1. Copy `.env.example` to `.env`
2. Replace placeholder values with your actual development keys
3. **Never commit your `.env` file**

## Deployment

The GitHub Actions workflow automatically:
- Uses repository secrets for production builds
- Deploys database migrations to Supabase
- Updates edge function secrets
- Builds and deploys to GitHub Pages

## Troubleshooting

If deployment fails:
1. Verify all required secrets are set in GitHub
2. Check that Supabase project reference is correct
3. Ensure your Supabase access token has sufficient permissions
4. Verify Resend API key is active and valid