-- Create simpler approve/reject functions that work with any crop_coefficients structure
CREATE OR REPLACE FUNCTION approve_pending_coefficient_simple(pending_id UUID)
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
  
  -- First, check if crop_coefficients table exists and what columns it has
  -- Insert basic coefficient data (adaptable to different table structures)
  BEGIN
    -- Try to insert with FAO-56 structure first
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
      notes,
      created_at,
      updated_at
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
      pending_record.notes,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, try with minimal structure
    BEGIN
      INSERT INTO crop_coefficients (variety_id, source, notes, created_at)
      VALUES (pending_record.crop_variety_id, pending_record.source, pending_record.notes, NOW());
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Could not insert into crop_coefficients table. Error: %', SQLERRM;
    END;
  END;
  
  -- Remove the pending coefficient
  DELETE FROM pending_crop_coefficients WHERE id = pending_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simpler reject function
CREATE OR REPLACE FUNCTION reject_pending_coefficient_simple(pending_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM pending_crop_coefficients WHERE id = pending_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending coefficient not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;