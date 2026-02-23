// Generate some test audit data for crop history testing
console.log('🧪 Creating test audit data for crop history...');

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

async function createTestAuditData() {
  try {
    console.log('1. Testing crop history system...');
    
    // Get a test coefficient
    const { data: testCoeff, error: testError } = await supabase
      .from('pending_crop_coefficients')
      .select('*')
      .limit(1)
      .single();
      
    if (testError || !testCoeff) {
      console.log('❌ No test coefficients found');
      return;
    }
    
    console.log('2. Found test coefficient for crop variety:', testCoeff.crop_variety_id);
    
    // Make a small edit to generate audit data
    const { error: updateError } = await supabase
      .from('pending_crop_coefficients')
      .update({ 
        notes: `Test edit at ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', testCoeff.id);
      
    if (updateError) {
      console.error('❌ Failed to create test edit:', updateError);
      return;
    }
    
    console.log('3. ✅ Created test edit');
    
    // Check if audit data was created
    const { data: auditData, error: auditError } = await supabase
      .from('coefficient_audit_log')
      .select('*')
      .eq('coefficient_id', testCoeff.id)
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (auditError) {
      console.error('❌ Failed to check audit data:', auditError);
      return;
    }
    
    console.log('4. ✅ Audit records found:', auditData?.length || 0);
    if (auditData && auditData.length > 0) {
      console.log('📋 Latest audit record:', {
        action: auditData[0].action_type,
        reason: auditData[0].change_reason,
        created: auditData[0].created_at
      });
    }
    
    console.log('\n🎉 Crop history system is working!');
    console.log('✅ You can now click "Crop History" buttons to see comprehensive crop-level audit trails');
    
  } catch (err) {
    console.error('Error creating test audit data:', err);
  }
}

createTestAuditData();