# Crop Management System - Setup Instructions

## Overview
I've built a comprehensive crop management system for your Admin Panel that matches the functionality of your main dashboard. The system includes:

✅ **Full CRUD Operations**
- Add crops to locations with detailed information
- Edit existing crop details
- Delete crops with confirmation
- View all crops per location

✅ **Crop Details Tracked**
- Crop name and variety
- Planting and harvest dates
- Area in acres
- Irrigation method (drip, sprinkler, flood, micro-spray, surface)
- Soil type
- Status (active, planned, harvested)
- Notes for each crop

✅ **UI Features**
- Beautiful Add/Edit crop modals with comprehensive forms
- Crop cards showing all details
- Expandable crop lists (show/hide when >2 crops)
- Edit and delete buttons for each crop
- Real-time crop counts per location
- Success/error messaging

## Database Setup

### Step 1: Create the location_crops Table

1. Open your Supabase Dashboard
2. Go to the **SQL Editor** tab
3. Click **New Query**
4. Copy and paste the contents of: `supabase/migrations/create-location-crops-table.sql`
5. Click **Run** to execute the migration

This will create:
- `location_crops` table with all necessary columns
- Indexes for performance (location_id, status)
- Row Level Security (RLS) policies for data protection
- Automatic timestamp updates
- Foreign key relationship to user_locations

### Step 2: Verify the Table

Run this query to verify the table was created:

```sql
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'location_crops'
ORDER BY 
    ordinal_position;
```

You should see all these columns:
- id (uuid)
- location_id (uuid)
- crop_id (text)
- crop_name (text)
- crop_variety (text)
- planting_date (date)
- harvest_date (date)
- area_acres (numeric)
- irrigation_method (text)
- soil_type (text)
- notes (text)
- status (text)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

## Using the Crop Management System

### Adding a Crop

1. Open the Admin Panel
2. Click the **Locations & Crops** tab
3. Find the location you want to add a crop to
4. Click the **Add Crop** button
5. Fill in the form:
   - **Crop Name** * (required) - e.g., "Tomatoes", "Almonds", "Lettuce"
   - **Variety** - e.g., "Roma", "Beefsteak"
   - **Area (acres)** - e.g., 5.5
   - **Planting Date** * (required)
   - **Harvest Date** - optional
   - **Irrigation Method** - dropdown (drip, sprinkler, etc.)
   - **Soil Type** - e.g., "Loam", "Clay"
   - **Status** - Active, Planned, or Harvested
   - **Notes** - Any additional information
6. Click **Add Crop**

### Editing a Crop

1. Find the crop in a location card
2. Click the **Edit** button (blue pencil icon)
3. Update any fields
4. Click **Save Changes**

### Deleting a Crop

1. Find the crop in a location card
2. Click the **Delete** button (red trash icon)
3. Confirm the deletion

### Viewing Crops

- Each location card shows the total crop count
- First 2 crops are displayed by default
- Click "Show X more..." to expand and see all crops
- Each crop shows:
  - Crop name and variety
  - Planting date
  - Quick action buttons (edit/delete)

## Features Implemented

### Data Model
```typescript
interface LocationCrop {
  id: string;
  location_id: string;
  crop_id: string;
  crop_name: string;
  crop_variety?: string;
  planting_date: string;
  harvest_date?: string;
  area_acres?: number;
  irrigation_method?: 'drip' | 'sprinkler' | 'flood' | 'micro-spray' | 'surface';
  soil_type?: string;
  notes?: string;
  status: 'active' | 'harvested' | 'planned';
  created_at: string;
  updated_at: string;
}
```

### State Management
- Crops loaded on panel open
- Real-time updates after add/edit/delete
- Automatic reload when locations change
- Expandable/collapsible crop lists per location

### Security
- Row Level Security (RLS) enabled
- Users can only see/edit crops for their own locations
- Proper authentication checks
- Secure database operations

### UI/UX
- Green gradient theme for crop-related actions
- Responsive 2-column form layout
- Date pickers for planting/harvest dates
- Dropdown selectors for irrigation method and status
- Textarea for notes
- Disabled state for required fields
- Loading states for async operations
- Success/error messages

## Next Steps

After running the SQL migration:

1. ✅ Open your app and navigate to Admin Panel
2. ✅ Go to Locations & Crops tab
3. ✅ Add your first crop to test
4. ✅ Try editing and deleting crops
5. ✅ Verify data persists on page reload

## Troubleshooting

### "Table does not exist" error
- Make sure you ran the SQL migration in Supabase
- Verify the table name is exactly `location_crops`

### "Permission denied" error
- Check RLS policies are created
- Verify you're logged in
- Confirm the location belongs to your user

### Crops not loading
- Check browser console for errors
- Verify you have locations created
- Ensure the database connection is working

### Missing columns error
- Re-run the migration script
- Check for any SQL errors in Supabase logs

## Database Relationships

```
user_profiles (organization/company)
    ↓
user_locations (your farm locations)
    ↓
location_crops (crops at each location)
```

- When a location is deleted, all its crops are automatically deleted (CASCADE)
- Crops are scoped to locations
- Locations are scoped to users/organizations

## File Changes

### Modified Files
1. **UserManagementPanel.tsx** (~1650 lines)
   - Added crop state management
   - Added crop CRUD handlers
   - Updated location cards to show crops
   - Replaced placeholder Add Crop modal with full functional version
   - Added Edit Crop modal
   - Added crop loading/filtering/expansion logic

### New Files
1. **create-location-crops-table.sql**
   - Complete database schema for crops
   - RLS policies
   - Indexes for performance
   - Triggers for timestamp updates

---

**You're all set!** The crop management system is fully functional and ready to use. Just run the SQL migration and start managing your crops! 🌱
