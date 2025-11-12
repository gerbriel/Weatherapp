-- Migration to add location management features
-- Add fields for favorites, ordering, and weather station information

ALTER TABLE user_locations 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS weatherstation text,
ADD COLUMN IF NOT EXISTS weatherstation_id text;

-- Add index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_user_locations_sort ON user_locations(user_id, sort_order);

-- Add index for favorites
CREATE INDEX IF NOT EXISTS idx_user_locations_favorite ON user_locations(user_id, is_favorite) WHERE is_favorite = true;

-- Update existing locations to have a default sort order
UPDATE user_locations 
SET sort_order = row_number() OVER (PARTITION BY user_id ORDER BY created_at)
WHERE sort_order = 0;

COMMENT ON COLUMN user_locations.is_favorite IS 'Whether this location is marked as a favorite by the user';
COMMENT ON COLUMN user_locations.sort_order IS 'User-defined sort order for organizing locations';
COMMENT ON COLUMN user_locations.weatherstation IS 'Name of the associated weather station (e.g., "Arvin-Edison")';
COMMENT ON COLUMN user_locations.weatherstation_id IS 'ID of the associated weather station (e.g., "125")';