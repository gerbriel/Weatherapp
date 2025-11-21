# Real-Time Sync Fix Instructions

## Problem
Crops added in the Admin Panel are not showing up on the Dashboard, and vice versa.

## Root Cause
The real-time subscription had invalid filter syntax AND Realtime may not be enabled for the `location_crops` table in Supabase.

## Solution Steps

### Step 1: Enable Realtime in Supabase Dashboard
1. Go to your Supabase project: https://supabase.com/dashboard/project/mojgfvhhhqmcltbobksf
2. Click on **Database** in the left sidebar
3. Click on **Replication** (or **Publications**)
4. Find the `location_crops` table in the list
5. **Enable** the toggle switch next to `location_crops`
6. Click **Save** or **Update publication**

### Step 2: Run the SQL Script
1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Copy and paste the contents of `ENABLE_REALTIME.sql`
4. Click **Run**
5. You should see "FULL" in the replica_identity column

### Step 3: Restart Your Application
1. Stop your dev server (Ctrl+C in terminal)
2. Restart with `npm run dev`
3. Open the app in your browser
4. Open the browser console (F12)

### Step 4: Test the Sync
1. Add a crop from the **Dashboard** → Open **Admin Panel** → Check if it appears
2. Add a crop from the **Admin Panel** → Go back to **Dashboard** → Check if it appears
3. Watch the browser console for:
   - "Database change detected:" messages
   - "Loaded X crops from database" messages
   - "Crop saved to database:" messages

## What Was Fixed in the Code
- ✅ Removed invalid filter syntax in real-time subscriptions
- ✅ Both Dashboard and Admin Panel now listen to all location_crops changes
- ✅ Different channel names to avoid conflicts ('location_crops_changes' and 'location_crops_changes_admin')
- ✅ Removed localStorage listening (no longer needed)

## Debugging Tips
If it still doesn't work, check:
1. Browser console for errors
2. Supabase logs in the Dashboard → Logs section
3. Make sure you're using the same Supabase project
4. Verify the table name is exactly `location_crops` (not `location_crop` or `crop_locations`)
