-- Create pending_crop_coefficients table for user-submitted coefficient reviews
CREATE TABLE IF NOT EXISTS pending_crop_coefficients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_variety_id UUID NOT NULL REFERENCES crop_varieties(id) ON DELETE CASCADE,
  kc_initial DECIMAL(4,3) NOT NULL CHECK (kc_initial >= 0 AND kc_initial <= 2),
  kc_development DECIMAL(4,3) NOT NULL CHECK (kc_development >= 0 AND kc_development <= 2),
  kc_mid DECIMAL(4,3) NOT NULL CHECK (kc_mid >= 0 AND kc_mid <= 2),
  kc_late DECIMAL(4,3) NOT NULL CHECK (kc_late >= 0 AND kc_late <= 2),
  initial_stage_days INTEGER NOT NULL CHECK (initial_stage_days > 0),
  development_stage_days INTEGER NOT NULL CHECK (development_stage_days > 0),
  mid_stage_days INTEGER NOT NULL CHECK (mid_stage_days > 0),
  late_stage_days INTEGER NOT NULL CHECK (late_stage_days > 0),
  source TEXT DEFAULT 'User Submission',
  submitted_by_email TEXT,
  submitted_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE pending_crop_coefficients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and insert
CREATE POLICY "Users can read pending coefficients" ON pending_crop_coefficients
  FOR SELECT USING (true);

CREATE POLICY "Users can insert pending coefficients" ON pending_crop_coefficients
  FOR INSERT WITH CHECK (true);

-- Only admins can update/delete (we'll handle this through functions)
CREATE POLICY "Only admins can manage pending coefficients" ON pending_crop_coefficients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@example.com'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_coefficients_variety ON pending_crop_coefficients(crop_variety_id);
CREATE INDEX IF NOT EXISTS idx_pending_coefficients_created ON pending_crop_coefficients(created_at DESC);

-- Function to approve pending coefficient
CREATE OR REPLACE FUNCTION approve_pending_coefficient(pending_id UUID)
RETURNS VOID AS $$
DECLARE
  pending_record RECORD;
BEGIN
  -- Get the pending coefficient
  SELECT * INTO pending_record 
  FROM pending_crop_coefficients 
  WHERE id = pending_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending coefficient not found';
  END IF;
  
  -- Insert or update the crop coefficient using FAO-56 structure
  INSERT INTO crop_coefficients (
    variety_id,
    kc_initial,
    kc_development, 
    kc_mid,
    kc_late,
    initial_stage_days,
    development_stage_days,
    mid_stage_days,
    late_stage_days,
    source,
    notes
  ) VALUES (
    pending_record.crop_variety_id,
    pending_record.kc_initial,
    pending_record.kc_development,
    pending_record.kc_mid,
    pending_record.kc_late,
    pending_record.initial_stage_days,
    pending_record.development_stage_days,
    pending_record.mid_stage_days,
    pending_record.late_stage_days,
    pending_record.source,
    pending_record.notes
  )
  ON CONFLICT (variety_id) DO UPDATE SET
    kc_initial = EXCLUDED.kc_initial,
    kc_development = EXCLUDED.kc_development,
    kc_mid = EXCLUDED.kc_mid,
    kc_late = EXCLUDED.kc_late,
    initial_stage_days = EXCLUDED.initial_stage_days,
    development_stage_days = EXCLUDED.development_stage_days,
    mid_stage_days = EXCLUDED.mid_stage_days,
    late_stage_days = EXCLUDED.late_stage_days,
    source = EXCLUDED.source,
    notes = EXCLUDED.notes,
    updated_at = NOW();
  
  -- Remove the pending coefficient
  DELETE FROM pending_crop_coefficients WHERE id = pending_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject pending coefficient
CREATE OR REPLACE FUNCTION reject_pending_coefficient(pending_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM pending_crop_coefficients WHERE id = pending_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending coefficient not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;