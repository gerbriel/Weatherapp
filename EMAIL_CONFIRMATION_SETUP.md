# Email Confirmation Setup Guide

## Overview
Users now receive a confirmation prompt after signup and are redirected to the logged-in dashboard after clicking the email confirmation link.

## Changes Made

### 1. Signup Flow Updated
- **Before**: Signup immediately closed the modal
- **After**: Shows a "Check Your Email" screen with instructions

### 2. Email Redirect Configured
- Users who click the confirmation link are automatically redirected to `/dashboard`
- They will be logged in automatically upon confirmation

## Supabase Configuration Required

### Step 1: Configure Redirect URLs in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following **Redirect URLs**:

#### For Production:
```
https://your-domain.com/dashboard
https://your-domain.com
```

#### For Local Development:
```
http://localhost:5173/dashboard
http://localhost:5173
```

4. Click **Save**

### Step 2: Verify Email Template (Optional)

You can customize the email template in:
1. **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Ensure the confirmation link is present: `{{ .ConfirmationURL }}`

## User Experience

### Signup Flow:
1. User fills out signup form
2. Clicks "Sign Up"
3. Sees success screen: "Check Your Email"
4. Instructions displayed:
   - Check your email inbox
   - Click the confirmation link
   - You'll be automatically logged into the app

### Email Confirmation Flow:
1. User receives email from Supabase
2. Clicks "Confirm your email" link
3. Automatically redirected to `/dashboard`
4. User is logged in and ready to use the app

## Testing

### Test the Full Flow:
1. Sign up with a test email
2. Verify the "Check Your Email" screen appears
3. Check your email for the confirmation link
4. Click the confirmation link
5. Verify you're redirected to `/dashboard` and logged in

### Troubleshooting:

**Issue**: Confirmation link doesn't work
- **Solution**: Make sure redirect URL is configured in Supabase (see Step 1)

**Issue**: User not logged in after confirmation
- **Solution**: Check that email confirmation is enabled in Supabase Auth settings

**Issue**: Redirected to wrong page
- **Solution**: Verify the `emailRedirectTo` matches your Supabase redirect URLs

## Code Changes

### Files Modified:
1. `src/components/auth/SimpleSignupForm.tsx`
   - Added email confirmation screen
   - Shows next steps after signup
   
2. `src/contexts/AuthContextSimple.tsx`
   - Added `emailRedirectTo: '${window.location.origin}/dashboard'`
   
3. `src/contexts/AuthContext.tsx`
   - Added `emailRedirectTo: '${window.location.origin}/dashboard'`

## Security Notes

- Email confirmation is required before users can log in
- Confirmation links expire after 24 hours (configurable in Supabase)
- Users cannot access the app until email is confirmed
- Redirect URLs must be whitelisted in Supabase for security
