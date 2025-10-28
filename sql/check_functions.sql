-- Check if the pending coefficient functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('approve_pending_coefficient', 'reject_pending_coefficient');

-- Check if the pending_crop_coefficients table exists  
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'pending_crop_coefficients';