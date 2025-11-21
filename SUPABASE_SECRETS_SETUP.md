# Setting Up Supabase Secrets for Production

## Why We Need This

The database migrations reference `current_setting('app.admin_email', true)` to determine which user should have the 'superuser' role. This keeps your email address secure and out of the codebase.

## Local Development Setup

Your local setup is already configured in `supabase/.env.local` (which is gitignored).

## Production Deployment on Supabase

### Option 1: Using Supabase Vault (Recommended for Hosted Supabase)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **Vault**
4. Click **New Secret**
5. Create a secret with:
   - **Name**: `app.admin_email`
   - **Value**: `your-admin-email@example.com`
6. Click **Create Secret**

### Option 2: Using SQL (For Self-Hosted or Manual Setup)

Run this SQL in the Supabase SQL Editor:

```sql
-- Set the admin email as a database configuration parameter
ALTER DATABASE postgres SET app.admin_email = 'your-admin-email@example.com';

-- Reload the configuration
SELECT pg_reload_conf();
```

### Verifying It Works

After setting the secret, run this query to verify:

```sql
-- This should return your admin email
SELECT current_setting('app.admin_email', true);

-- This should show your user with 'superuser' role
SELECT email, role FROM public.user_profiles WHERE role = 'superuser';
```

## Running Migrations in Production

Once the secret is set, your migrations will automatically work:

1. Push your code to your repository
2. Deploy to your hosting platform (Vercel, Netlify, etc.)
3. The Supabase migrations will run automatically if you have CI/CD set up
4. OR manually run migrations from the Supabase Dashboard

## Security Checklist

- ✅ No emails hardcoded in migration files
- ✅ `supabase/.env.local` is in `.gitignore`
- ✅ Production uses Supabase Vault or database settings
- ✅ All migrations use `current_setting('app.admin_email', true)`

## Troubleshooting

**Problem**: Migrations fail with "unrecognized configuration parameter"

**Solution**: Make sure you set the secret BEFORE running the migrations. If migrations already ran, manually update the role:

```sql
UPDATE public.user_profiles 
SET role = 'superuser' 
WHERE email = 'your-admin-email@example.com';
```
