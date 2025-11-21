# Setting Up Supabase Secrets for Production

## Why We Need This

The database migrations reference `current_setting('app.admin_email', true)` to determine which user should have the 'superuser' role. This keeps your email address secure and out of the codebase.

## Local Development Setup

Your local setup is already configured in `supabase/.env.local` (which is gitignored).

## Production Deployment - SIMPLE METHOD ✅

**The easiest way is to just run this SQL in your Supabase SQL Editor:**

```sql
-- Simply set your user as superuser
UPDATE public.user_profiles 
SET role = 'superuser' 
WHERE email = 'your-admin-email@example.com';

-- OR if the profile doesn't exist yet, create it:
INSERT INTO public.user_profiles (id, email, role)
SELECT 
  id,
  email,
  'superuser'
FROM auth.users
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'superuser';

-- Verify it worked:
SELECT email, role FROM public.user_profiles WHERE email = 'your-admin-email@example.com';
```

That's it! The migrations only use `current_setting()` for **initial setup**. Once you're deployed, just run the SQL above once.

## Alternative: Using Supabase Vault (Optional)

If you want to use Vault for secret management:

1. Go to your Supabase Dashboard
2. Navigate to **Integrations** → **Vault** (in the left sidebar)
3. Click the **Secrets** tab
4. Use the SQL Editor to create a secret:

```sql
SELECT vault.create_secret(
  'your-admin-email@example.com',
  'admin_email',
  'Admin email for superuser'
);
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
