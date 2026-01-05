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

#### ProfileManager.tsx
- Added a new "Account" tab to the Manage Profile section
- Includes a "Danger Zone" with delete account functionality
- Shows confirmation dialog requiring the user to type "delete my account"
- Displays clear warning about what will be deleted:
  - Profile and settings
  - All locations and crops
  - All saved irrigation calculations and reports
  - Email notification preferences
- Has loading states and error handling
- Shows account information (email, role, created date)

#### UserProfile.tsx
- Removed the standalone delete account section
- Users should now access delete account via the Manage Profile modal

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

### ⚠️ IMPORTANT: Step 1 Must Be Completed First!

**Before testing the delete account feature, you MUST run the SQL function in Supabase.** Without this function, you'll see an error message saying the database function is not configured.

### Step 1: Run the SQL Function (REQUIRED)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `create_delete_user_function.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the query
6. Verify the function was created successfully (you should see a success message)

**What this does:** Creates a secure database function that allows any authenticated user to delete their own account.

### Step 2: Test the Feature
1. Build and deploy the app
2. Log in with a test account
3. Click on your user profile icon (top right)
4. Select "Manage Profile" from the dropdown
5. Navigate to the "Account" tab (third tab)
6. Scroll to the "Danger Zone" section
7. Click "Delete Account"
8. Type "delete my account" in the confirmation dialog
9. Click "Yes, Delete My Account"
10. Verify you're logged out and redirected to the home page

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
- **Users can only delete their own account** (checked via `auth.uid()`)
- **Any user can delete their account, regardless of role** (user, admin, superuser)
- Requires explicit confirmation by typing the confirmation phrase
- Note: The initial user who creates an organization is automatically set to admin role, but they can still delete their own account

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
3. `/src/components/ProfileManager.tsx` - Added Account tab with delete functionality
4. `/src/components/UserProfile.tsx` - Removed standalone delete section
5. `/create_delete_user_function.sql` - SQL function for secure deletion

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
