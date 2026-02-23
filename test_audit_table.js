// Test if audit trail table exists and create basic test data
console.log('🔍 Testing audit trail table existence...');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuditTable() {
  try {
    console.log('1. Checking if coefficient_audit_log table exists...');
    
    // Try to query the audit table
    const { data: auditData, error: auditError } = await supabase
      .from('coefficient_audit_log')
      .select('*')
      .limit(1);
      
    if (auditError) {
      console.error('❌ Audit table does not exist:', auditError.message);
      console.log('\n📝 You need to run this SQL in your Supabase Dashboard:');
      console.log('\n-- Copy and paste this into Supabase SQL Editor:');
      console.log(`
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

ALTER TABLE coefficient_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_operations_coefficient_audit_log" 
ON coefficient_audit_log 
FOR ALL 
TO anon, authenticated, service_role
USING (true) 
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_coefficient_id ON coefficient_audit_log(coefficient_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON coefficient_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON coefficient_audit_log(action_type);
      `);
      return;
    }
    
    console.log('✅ Audit table exists!');
    console.log('📊 Current audit records:', auditData?.length || 0);
    
    if (auditData && auditData.length > 0) {
      console.log('📋 Sample audit record:', auditData[0]);
    }
    
  } catch (err) {
    console.error('Error testing audit table:', err);
  }
}

testAuditTable();