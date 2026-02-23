-- Performance Optimization: Add Indexes
-- Generated: 2026-01-07
-- Improves query performance for common access patterns

-- ============================================
-- INDEX: user_settings lookups
-- ============================================
-- Speed up user_settings queries (currently 1.24ms avg)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
  ON public.user_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_lookup 
  ON public.user_settings(user_id, setting_key);

-- ============================================
-- INDEX: user_locations for RLS policies
-- ============================================
-- Speed up location_crops RLS policy lookups
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id 
  ON public.user_locations(user_id);

-- ============================================
-- INDEX: location_crops for common queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_location_crops_location_id 
  ON public.user_crops(location_id);

CREATE INDEX IF NOT EXISTS idx_location_crops_user_lookup 
  ON public.user_crops(location_id, variety_id);

-- ============================================
-- INDEX: user_profiles for auth lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
  ON public.user_profiles(email) 
  WHERE email IS NOT NULL;

-- ============================================
-- ANALYZE: Update statistics
-- ============================================
ANALYZE public.user_settings;
ANALYZE public.user_locations;
ANALYZE public.user_crops;
ANALYZE public.user_profiles;

-- ============================================
-- SUMMARY
-- ============================================
-- These indexes will speed up:
-- ✅ User settings lookups and upserts
-- ✅ Location crops RLS policy checks
-- ✅ Foreign key lookups
-- ✅ User profile queries
--
-- Expected impact:
-- - user_settings queries: 1.24ms → ~0.5ms
-- - RLS policy checks: Significantly faster with proper indexes
-- - Overall app responsiveness: Noticeably improved
