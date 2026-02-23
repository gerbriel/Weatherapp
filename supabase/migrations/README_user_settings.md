# User Settings Migration

This migration creates a `user_settings` table to store user preferences that should persist across devices.

## What it does

- Creates `user_settings` table with JSONB storage for flexible settings
- Sets up Row Level Security (RLS) so users can only access their own settings
- Creates indexes for performance
- Adds auto-updating `updated_at` timestamp

## Settings Stored

Currently stores:
- `selected_crops`: Array of selected crop types
- `crop_instances`: Array of crop instances with location assignments and custom Kc values

## How to apply

### Option 1: Supabase Dashboard (Recommended for hosted projects)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `20251209_create_user_settings.sql`
4. Run the migration

### Option 2: Supabase CLI (For local development)

```bash
cd weather-app
supabase db push
```

## Testing

After applying the migration, test by:
1. Logging in to the app
2. Selecting some crops
3. Assigning them to locations
4. Refreshing the page - crops should persist
5. Log in from another device - crops should sync across devices

## Rollback

If you need to rollback:

```sql
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP FUNCTION IF EXISTS update_user_settings_updated_at();
DROP TABLE IF EXISTS user_settings CASCADE;
```
