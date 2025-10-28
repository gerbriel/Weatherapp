import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testWithoutUpdating() {
  try {
    console.log('🧪 Testing coefficient functionality without database updates...\n');
    
    // Test 1: Can we read the data properly?
    console.log('📖 Testing data loading...');
    const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
      supabase.from('pending_crop_coefficients').select('*').eq('status', 'pending'),
      supabase.from('pending_crop_coefficients').select('*').eq('status', 'approved'),
      supabase.from('pending_crop_coefficients').select('*').eq('status', 'rejected')
    ]);
    
    console.log(`Pending: ${pendingResult.data?.length || 0} records`);
    console.log(`Approved: ${approvedResult.data?.length || 0} records`);
    console.log(`Rejected: ${rejectedResult.data?.length || 0} records`);
    
    // Test 2: Create a new record to test if INSERT works
    console.log('\n➕ Testing INSERT operation...');
    const { data: insertResult, error: insertError } = await supabase
      .from('pending_crop_coefficients')
      .insert({
        crop_variety_id: '0fa53ea5-d5dd-4c34-b71e-7a91a57f7473',
        kc_initial: 0.6,
        kc_development: 0.9,
        kc_mid: 1.3,
        kc_late: 0.7,
        initial_stage_days: 20,
        development_stage_days: 30,
        mid_stage_days: 50,
        late_stage_days: 20,
        source: 'RLS Bypass Test',
        submitted_by_email: 'bypass@test.com',
        submitted_by_name: 'RLS Test',
        status: 'pending'
      })
      .select();
    
    if (insertError) {
      console.error('❌ INSERT failed:', insertError);
    } else {
      console.log('✅ INSERT successful:', insertResult?.[0]?.id);
      
      // Test 3: Try to update this new record immediately
      if (insertResult?.[0]?.id) {
        const newId = insertResult[0].id;
        
        console.log('\n🔄 Testing UPDATE on newly created record...');
        const { data: updateResult, error: updateError } = await supabase
          .from('pending_crop_coefficients')
          .update({ status: 'approved' })
          .eq('id', newId)
          .select();
        
        if (updateError) {
          console.error('❌ UPDATE failed:', updateError);
        } else {
          console.log('✅ UPDATE result:', updateResult);
          
          // Verify the update
          const { data: verifyResult } = await supabase
            .from('pending_crop_coefficients')
            .select('id, status')
            .eq('id', newId)
            .single();
          
          console.log('📋 Verification:', verifyResult);
        }
        
        // Clean up
        console.log('\n🧹 Cleaning up test record...');
        const { error: deleteError } = await supabase
          .from('pending_crop_coefficients')
          .delete()
          .eq('id', newId);
        
        if (deleteError) {
          console.error('❌ DELETE failed:', deleteError);
        } else {
          console.log('✅ Cleanup successful');
        }
      }
    }
    
    console.log('\n💡 Summary:');
    console.log('If UPDATE works on new records but not existing ones,');
    console.log('the issue might be with specific record ownership or timestamps.');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testWithoutUpdating();