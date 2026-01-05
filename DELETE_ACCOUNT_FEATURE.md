# Delete Account Feature - Setup Guide

## Overview
I've implemented a complete delete account feature that allows users to permanently delete their account and all associated data from within the app.

## What's Been Implemented

### 1. Backend Changes

#### AuthContextSimple.tsx & AuthContext.tsx
- Added `deleteAccount()` method that:
  - Calls the Supabase `delete_user()` RPC function
  - Clears local storage
  - Signs out the user automatically
  - Redirects to home page

### 2. Frontend Changes

#### UserProfile.tsx
- Added a "Danger Zone" section at the bottom of the profile page
- Includes a confirmation dialog requiring the user to type "delete my account"
- Shows a clear warning about what will be deleted:
  - Profile and settings
  - All locations and crops
  - All saved irrigation calculations and reports
  - Email notification preferences
- Has loading states and error handling

### 3. Database Setup Required

#### SQL Function: create_delete_user_function.sql
A SQL function has been created that needs to be run in your Supabase SQL editor:

```sql
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
```

## Setup Instructions

### Step 1: Run the SQL Function
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open the file `create_delete_user_function.sql` 
4. Run the SQL query
5. Verify it was created successfully

### Step 2: Test the Feature
1. Build and deploy the app
2. Log in with a test account
3. Navigate to the Profile page (User menu → Profile Settings)
4. Scroll to the bottom to see the "Danger Zone"
5. Click "Delete Account"
6. Type "delete my account" in the confirmation dialog
7. Click "Yes, Delete My Account"
8. Verify you're logged out and redirected to the home page

### Step 3: Verify Database Cleanup
1. Check that the user was removed from `auth.users`
2. Verify cascade deletion worked for:
   - `user_profiles`
   - `user_settings`
   - `user_locations`
   - Any other tables with CASCADE foreign keys

## How It Works

### Cascade Deletion
The database schema uses `ON DELETE CASCADE` foreign key constraints, so when a user is deleted from `auth.users`, it automatically deletes:

1. **user_profiles** - User's profile information
2. **user_settings** - Introduction/closing messages and other settings
3. **user_locations** - All saved locations
4. **Any other user-related data** with CASCADE foreign keys

### Security
- The `delete_user()` function uses `SECURITY DEFINER` to run with elevated privileges
- It verifies the user is authenticated before allowing deletion
- Users can only delete their own account (checked via `auth.uid()`)
- Requires explicit confirmation by typing the confirmation phrase

### User Experience
1. User clicks "Delete Account" button
2. Sees a warning dialog with all consequences
3. Must type "delete my account" to confirm
4. Button is disabled until correct text is entered
5. Shows loading state during deletion
6. Automatically logged out and redirected on success
7. Shows error message if deletion fails

## Files Modified

1. `/src/contexts/AuthContextSimple.tsx` - Added deleteAccount method
2. `/src/contexts/AuthContext.tsx` - Added deleteAccount method
3. `/src/components/UserProfile.tsx` - Added Danger Zone UI with confirmation
4. `/create_delete_user_function.sql` - SQL function for secure deletion

## Safety Features

✅ Double confirmation required (button + text entry)
✅ Clear warning about what will be deleted
✅ Cannot be undone (permanent deletion)
✅ Automatic logout after deletion
✅ Error handling with user-friendly messages
✅ Loading states to prevent double-clicks
✅ Database-level security with SECURITY DEFINER

## Next Steps

1. ✅ Run the SQL function in Supabase
2. ✅ Test with a test account
3. ✅ Verify cascade deletion works properly
4. ✅ Consider adding email confirmation before deletion (optional)
5. ✅ Consider keeping deleted user emails in a blocklist (optional)

## Notes

- The deletion is **permanent and cannot be undone**
- All user data is removed from the database
- The user must create a new account if they want to return
- Consider implementing a "soft delete" if you want to retain data for a period before permanent deletion
