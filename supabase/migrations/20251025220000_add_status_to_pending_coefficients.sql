-- Add status field to pending_crop_coefficients for stage system
-- This allows us to track approved/rejected without deleting records

ALTER TABLE pending_crop_coefficients 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Update existing records to have 'pending' status
UPDATE pending_crop_coefficients 
SET status = 'pending' 
WHERE status IS NULL;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_pending_crop_coefficients_status 
ON pending_crop_coefficients(status);

-- Add constraint to ensure valid status values
ALTER TABLE pending_crop_coefficients 
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'approved', 'rejected'));