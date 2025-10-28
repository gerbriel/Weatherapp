-- Add status field to pending_crop_coefficients table
ALTER TABLE pending_crop_coefficients 
ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));