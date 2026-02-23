import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkRLSPolicies() {
  try {
    console.log('🔒 Checking RLS policies and permissions...\n');
    
    // Try a simple select to see if we can read
    console.log('📖 Testing SELECT permissions:');
    const { data: selectData, error: selectError } = await supabase
      .from('pending_crop_coefficients')
      .select('id, status')
      .limit(1);
    
    if (selectError) {
      console.error('❌ SELECT error:', selectError);
    } else {
      console.log('✅ SELECT works, found:', selectData?.length, 'records');
    }
    
    // Try a simple update
    console.log('\n🔄 Testing UPDATE permissions:');
    if (selectData && selectData.length > 0) {
      const testId = selectData[0].id;
      const currentStatus = selectData[0].status;
      const newStatus = currentStatus === 'pending' ? 'approved' : 'pending';
      
      console.log(`Attempting to update ${testId} from "${currentStatus}" to "${newStatus}"`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('pending_crop_coefficients')
        .update({ status: newStatus })
        .eq('id', testId)
        .select();
      
      if (updateError) {
        console.error('❌ UPDATE error:', updateError);
      } else {
        console.log('✅ UPDATE successful, returned data:', updateData);
        
        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
          .from('pending_crop_coefficients')
          .select('id, status')
          .eq('id', testId)
          .single();
        
        if (verifyError) {
          console.error('❌ VERIFY error:', verifyError);
        } else {
          console.log('📋 Verification: Status is now', verifyData.status);
        }
      }
    }
    
    // Try INSERT to test permissions
    console.log('\n➕ Testing INSERT permissions:');
    const { data: insertData, error: insertError } = await supabase
      .from('pending_crop_coefficients')
      .insert({
        crop_variety_id: '0fa53ea5-d5dd-4c34-b71e-7a91a57f7473', // Use existing variety ID
        kc_initial: 0.5,
        kc_development: 0.8,
        kc_mid: 1.2,
        kc_late: 0.9,
        initial_stage_days: 25,
        development_stage_days: 35,
        mid_stage_days: 45,
        late_stage_days: 25,
        source: 'RLS Test',
        submitted_by_email: 'test@example.com',
        submitted_by_name: 'Test User',
        status: 'pending'
      })
      .select();
    
    if (insertError) {
      console.error('❌ INSERT error:', insertError);
    } else {
      console.log('✅ INSERT successful, created record:', insertData?.[0]?.id);
      
      // Clean up the test record
      if (insertData?.[0]?.id) {
        await supabase
          .from('pending_crop_coefficients')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Cleaned up test record');
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

checkRLSPolicies();