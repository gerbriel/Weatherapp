-- Add audit trail system for coefficient changes
-- This SQL should be run in your Supabase SQL Editor Dashboard

-- Create audit trail table for tracking coefficient changes
CREATE TABLE IF NOT EXISTS coefficient_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coefficient_id uuid REFERENCES pending_crop_coefficients(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'approve', 'reject', 'delete', 'revert')),
  old_values jsonb,
  new_values jsonb,
  changed_by text DEFAULT 'admin',
  change_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for audit log
ALTER TABLE coefficient_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit log access
CREATE POLICY "allow_all_operations_coefficient_audit_log" 
ON coefficient_audit_log 
FOR ALL 
TO anon, authenticated, service_role
USING (true) 
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_coefficient_id ON coefficient_audit_log(coefficient_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON coefficient_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON coefficient_audit_log(action_type);

-- Create function to automatically log changes
CREATE OR REPLACE FUNCTION log_coefficient_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
    VALUES (NEW.id, 'create', NULL, to_jsonb(NEW), 'Initial creation');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
    VALUES (NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), 'Record updated');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
    VALUES (OLD.id, 'delete', to_jsonb(OLD), NULL, 'Record deleted');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log all changes
CREATE TRIGGER coefficient_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pending_crop_coefficients
  FOR EACH ROW EXECUTE FUNCTION log_coefficient_change();

-- Verify the audit system
SELECT 'Audit trail system created successfully' as status;