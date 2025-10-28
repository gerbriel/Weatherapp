-- Fix audit trail deletion trigger
-- Migration: Fix foreign key constraint issue with deletion audit logging

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS coefficient_audit_trigger ON pending_crop_coefficients;

-- Step 2: Update the audit function to handle deletion properly
CREATE OR REPLACE FUNCTION log_coefficient_change()
RETURNS TRIGGER AS $$
DECLARE
    action_description text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_description := 'New coefficient submission';
    INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
    VALUES (NEW.id, 'create', NULL, to_jsonb(NEW), action_description);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine the type of update based on status changes
    IF OLD.status != NEW.status THEN
      CASE 
        WHEN NEW.status = 'approved' THEN
          action_description := 'Coefficient approved and published to live database';
          INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
          VALUES (NEW.id, 'approve', to_jsonb(OLD), to_jsonb(NEW), action_description);
        WHEN NEW.status = 'rejected' THEN
          action_description := 'Coefficient submission rejected';
          INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
          VALUES (NEW.id, 'reject', to_jsonb(OLD), to_jsonb(NEW), action_description);
        WHEN NEW.status = 'pending' AND OLD.status IN ('approved', 'rejected') THEN
          action_description := 'Coefficient reverted to pending for re-review';
          INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
          VALUES (NEW.id, 'revert', to_jsonb(OLD), to_jsonb(NEW), action_description);
        ELSE
          action_description := 'Status changed from ' || OLD.status || ' to ' || NEW.status;
          INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
          VALUES (NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), action_description);
      END CASE;
    ELSE
      -- Regular field updates
      action_description := 'Coefficient values updated';
      INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
      VALUES (NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), action_description);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    action_description := 'Coefficient permanently deleted';
    INSERT INTO coefficient_audit_log (coefficient_id, action_type, old_values, new_values, change_reason)
    VALUES (OLD.id, 'delete', to_jsonb(OLD), NULL, action_description);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create separate triggers for different operations
-- BEFORE DELETE trigger to log deletion before the record is removed
CREATE TRIGGER coefficient_audit_delete_trigger
  BEFORE DELETE ON pending_crop_coefficients
  FOR EACH ROW EXECUTE FUNCTION log_coefficient_change();

-- AFTER INSERT/UPDATE trigger for other operations
CREATE TRIGGER coefficient_audit_change_trigger
  AFTER INSERT OR UPDATE ON pending_crop_coefficients
  FOR EACH ROW EXECUTE FUNCTION log_coefficient_change();

SELECT 'Fixed audit trail deletion trigger' as status;