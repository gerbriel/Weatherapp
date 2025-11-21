# 🌱 How to Add Crops - Step by Step

## Current Issue
You're looking at the **Crops tab** which only DISPLAYS crops. To ADD crops, you need to use the **Admin Panel** or the **Locations tab**.

## ⚠️ FIRST: Run Database Migration

Before you can add any crops, you MUST create the `location_crops` table:

### Step 1: Create the Database Table

1. Open **Supabase Dashboard** → **SQL Editor**
   - URL: https://supabase.com/dashboard/project/mojgfvhhhqmcltbobksf/sql

2. Click **New Query**

3. Copy and paste the contents of:
   ```
   /Users/gabrielrios/Desktop/ET/weather-app/supabase/migrations/create-location-crops-table.sql
   ```

4. Click **Run** ▶️

5. You should see: "Success. No rows returned"

---

## 🎯 Option 1: Add Crops via Admin Panel (RECOMMENDED)

1. In the Organization Management modal (current screen)
2. Click **Admin Panel** button (purple button at bottom)
3. Go to **Locations & Crops** tab (3rd tab)
4. Find the location you want to add a crop to
5. Click the green **Add Crop** button on that location
6. Fill in the form and click **Add Crop**

---

## 🎯 Option 2: Add Crops via Locations Tab

1. In the Organization Management modal
2. Click the **Locations** tab (2nd tab)
3. You'll see your 9 locations listed
4. Click on a location to expand it
5. Click **Add Crop** button
6. Fill in the form

---

## 📋 What the Crops Tab Does

The **Crops tab** (where you are now) is a **read-only viewer** that shows:
- Total count of all crops across all locations
- Summary of crops organization-wide
- Quick overview of crop status

It does NOT have an "Add Crop" button because crops are tied to specific locations.

---

## 🔍 Troubleshooting

### "Cannot insert into table location_crops"
→ You haven't run the SQL migration yet. See Step 1 above.

### "No Add Crop button visible"
→ You need to be in the **Locations tab** or **Admin Panel → Locations & Crops tab**

### "I ran the migration but still can't add crops"
→ Hard refresh your browser: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows)

---

## 🚀 Quick Start (Right Now)

**Do this in order:**

1. ✅ Open new tab: [Supabase SQL Editor](https://supabase.com/dashboard/project/mojgfvhhhqmcltbobksf/sql)

2. ✅ Run the migration SQL from: `supabase/migrations/create-location-crops-table.sql`

3. ✅ Close Organization Management modal

4. ✅ Re-open Organization Management modal

5. ✅ Click **Admin Panel** (purple button)

6. ✅ Go to **Locations & Crops** tab

7. ✅ Click **Add Crop** on any location

8. ✅ Fill in crop details

9. ✅ Click **Add Crop** button

10. ✅ Crop will appear in the location card AND in the Crops tab

---

**Let me know once you've run the database migration and I'll help you add your first crop!** 🌱
