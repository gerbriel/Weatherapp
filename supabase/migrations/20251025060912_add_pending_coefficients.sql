-- Add pending coefficients system for user submissions
-- This allows non-admin users to submit coefficient changes for review

-- Pending crop coefficients table for user submissions
CREATE TABLE pending_crop_coefficients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    variety_id UUID REFERENCES crop_varieties(id) ON DELETE CASCADE,
    growth_stage_id UUID REFERENCES growth_stages(id) ON DELETE CASCADE,
    kc_value DECIMAL(4,3) NOT NULL,
    stage_duration_days INTEGER NOT NULL,
    notes TEXT,
    source VARCHAR(255),
    
    -- Submission metadata
    submitted_by_email VARCHAR(255),
    submitted_by_name VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by_email VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- If approved, reference to the created coefficient
    approved_coefficient_id UUID REFERENCES crop_coefficients(id) ON DELETE SET NULL,
    
    UNIQUE(variety_id, growth_stage_id, submitted_by_email, submitted_at)
);

-- Add user submission tracking to crop coefficients
ALTER TABLE crop_coefficients ADD COLUMN IF NOT EXISTS submitted_by_email VARCHAR(255);
ALTER TABLE crop_coefficients ADD COLUMN IF NOT EXISTS is_user_submitted BOOLEAN DEFAULT false;
ALTER TABLE crop_coefficients ADD COLUMN IF NOT EXISTS approved_by_email VARCHAR(255);

-- Create indexes for performance
CREATE INDEX idx_pending_coefficients_status ON pending_crop_coefficients(status);
CREATE INDEX idx_pending_coefficients_variety ON pending_crop_coefficients(variety_id);
CREATE INDEX idx_pending_coefficients_submitted ON pending_crop_coefficients(submitted_at);

-- Enable RLS
ALTER TABLE pending_crop_coefficients ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow anonymous access to pending coefficients" ON pending_crop_coefficients FOR ALL 
USING (true);

-- Function to approve pending coefficient
CREATE OR REPLACE FUNCTION approve_pending_coefficient(
    pending_id UUID,
    reviewer_email VARCHAR(255),
    review_notes_text TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    pending_record RECORD;
    new_coefficient_id UUID;
BEGIN
    -- Get the pending coefficient
    SELECT * INTO pending_record 
    FROM pending_crop_coefficients 
    WHERE id = pending_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending coefficient not found or already reviewed';
    END IF;
    
    -- Create new coefficient or update existing one
    INSERT INTO crop_coefficients (
        variety_id, 
        growth_stage_id, 
        kc_value, 
        stage_duration_days, 
        notes, 
        source,
        submitted_by_email,
        is_user_submitted,
        approved_by_email
    ) VALUES (
        pending_record.variety_id,
        pending_record.growth_stage_id,
        pending_record.kc_value,
        pending_record.stage_duration_days,
        pending_record.notes,
        pending_record.source,
        pending_record.submitted_by_email,
        true,
        reviewer_email
    )
    ON CONFLICT (variety_id, growth_stage_id) 
    DO UPDATE SET 
        kc_value = EXCLUDED.kc_value,
        stage_duration_days = EXCLUDED.stage_duration_days,
        notes = EXCLUDED.notes,
        source = EXCLUDED.source,
        submitted_by_email = EXCLUDED.submitted_by_email,
        is_user_submitted = EXCLUDED.is_user_submitted,
        approved_by_email = EXCLUDED.approved_by_email
    RETURNING id INTO new_coefficient_id;
    
    -- Update pending record
    UPDATE pending_crop_coefficients 
    SET 
        status = 'approved',
        reviewed_by_email = reviewer_email,
        reviewed_at = NOW(),
        review_notes = review_notes_text,
        approved_coefficient_id = new_coefficient_id
    WHERE id = pending_id;
    
    RETURN new_coefficient_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reject pending coefficient
CREATE OR REPLACE FUNCTION reject_pending_coefficient(
    pending_id UUID,
    reviewer_email VARCHAR(255),
    review_notes_text TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE pending_crop_coefficients 
    SET 
        status = 'rejected',
        reviewed_by_email = reviewer_email,
        reviewed_at = NOW(),
        review_notes = review_notes_text
    WHERE id = pending_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
