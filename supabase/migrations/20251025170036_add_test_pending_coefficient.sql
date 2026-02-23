-- Create a test pending coefficient for admin panel testing
INSERT INTO pending_crop_coefficients (
  crop_variety_id,
  kc_initial,
  kc_development,
  kc_mid,
  kc_late,
  initial_stage_days,
  development_stage_days,
  mid_stage_days,
  late_stage_days,
  source,
  submitted_by_email,
  submitted_by_name,
  notes
) 
SELECT 
  id as crop_variety_id,
  0.4 as kc_initial,
  0.7 as kc_development,
  1.15 as kc_mid,
  0.8 as kc_late,
  25 as initial_stage_days,
  35 as development_stage_days,
  40 as mid_stage_days,
  30 as late_stage_days,
  'Test User Submission' as source,
  'testuser@example.com' as submitted_by_email,
  'Test User' as submitted_by_name,
  'This is a test coefficient submission for testing the admin panel review workflow.' as notes
FROM crop_varieties 
LIMIT 1;