# Deployment Setup for Supabase

## Local Development

1. Copy the environment template:
   ```bash
   cp supabase/.env.template supabase/.env.local
   ```

2. Edit `supabase/.env.local` and set your admin email:
   ```
   ADMIN_EMAIL=your-email@example.com
   ```

3. The migrations will automatically use this email to set up the superuser role.

## Production Deployment

### Setting Up Database Secrets in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings > Vault**
3. Click **New Secret**
4. Add the following secret:
   - **Name**: `app.admin_email`
   - **Value**: Your admin email address
   - Click **Save**

### Running Migrations

The migrations use `current_setting('app.admin_email', true)` to read this secret value.

When you run migrations in production, they will automatically:
- Assign the 'superuser' role to the email specified in the vault
- Keep this email secure and never exposed in the codebase

### Verifying the Setup

After deployment, verify your superuser is set correctly:

```sql
SELECT email, role FROM public.user_profiles WHERE role = 'superuser';
```

You should see your admin email with the 'superuser' role.

## Security Notes

- ✅ `.env.local` files are gitignored and never committed
- ✅ Production uses Supabase Vault for secrets
- ✅ Migration files use `current_setting()` to read secrets dynamically
- ✅ No hardcoded emails in the repository

## Troubleshooting

If the superuser role isn't being assigned:

1. **Check the secret is set**: In Supabase Dashboard > Settings > Vault, verify `app.admin_email` exists
2. **Run the migration manually**: The relevant migrations are:
   - `20251120190000_clean_auth_system.sql` (initial setup)
   - `20251120200000_add_company_phone_to_profiles.sql` (profile update)
3. **Manually set the role**:
   ```sql
   UPDATE public.user_profiles 
   SET role = 'superuser' 
   WHERE email = 'your-email@example.com';
   ```
