# Check Supabase Authentication Configuration

This error "Database error querying schema" after trying everything suggests a Supabase project configuration issue, not a database issue.

## Check These Settings in Supabase Dashboard:

### 1. Authentication → URL Configuration
Go to: **Settings → Authentication → URL Configuration**

Check:
- **Site URL**: Should be `http://localhost:5173` for development
- **Redirect URLs**: Should include `http://localhost:5173/**`

### 2. Authentication → Email Auth
Go to: **Settings → Authentication → Providers → Email**

Check:
- ✅ **Enable Email provider** - Should be ON
- ⚠️ **Confirm email** - Try turning this **OFF** temporarily
- **Double confirm email changes** - Should be OFF

### 3. Check for Auth Hooks
Go to: **Database → Webhooks** or **Database → Hooks**

- If there are any hooks configured for `auth.users` table, **disable them temporarily**

### 4. Check Realtime Settings
Go to: **Settings → API**

- Make sure your **Project URL** matches what's in your `.env` file
- Verify **anon/public key** matches your `.env` file

### 5. Reset Auth Configuration (Last Resort)
If nothing works, we may need to reset the entire auth system.

## Try This First:

### Disable Email Confirmation
1. Go to **Authentication → Providers → Email**
2. Turn **OFF** "Confirm email"
3. Click Save
4. Try logging in again

The "schema" error might be because Supabase is trying to validate email confirmation and hitting an issue with the user_profiles table structure.

## Alternative: Create a Fresh Test User

Instead of logging in with your existing account, try creating a brand new test account to see if the issue is specific to your user or affects all users.

Let me know what you find in the Authentication settings!
