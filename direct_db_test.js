import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function directDatabaseTest() {
  try {
    console.log('🔍 Direct database debugging...\n');
    
    // Get a specific record to test with
    const { data: targetRecord, error: selectError } = await supabase
      .from('pending_crop_coefficients')
      .select('*')
      .eq('status', 'pending')
      .limit(1)
      .single();
    
    if (selectError || !targetRecord) {
      console.error('❌ Could not find pending record:', selectError);
      return;
    }
    
    console.log('🎯 Target record:', {
      id: targetRecord.id,
      status: targetRecord.status,
      created_at: targetRecord.created_at
    });
    
    // Try update with explicit WHERE and returning data
    console.log('\n🔄 Attempting update with .select()...');
    const { data: updateResult, error: updateError, count } = await supabase
      .from('pending_crop_coefficients')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetRecord.id)
      .select('id, status, updated_at');
    
    console.log('Update result:', { updateResult, updateError, count });
    
    if (!updateError) {
      // Check if the update actually happened
      console.log('\n🔍 Checking if update persisted...');
      const { data: checkResult, error: checkError } = await supabase
        .from('pending_crop_coefficients')
        .select('id, status, updated_at')
        .eq('id', targetRecord.id)
        .single();
      
      console.log('Check result:', { checkResult, checkError });
      
      if (checkResult?.status === 'approved') {
        console.log('✅ Update was successful! Reverting...');
        
        // Revert the change
        await supabase
          .from('pending_crop_coefficients')
          .update({ status: 'pending' })
          .eq('id', targetRecord.id);
      } else {
        console.log('❌ Update did not persist');
      }
    }
    
    // Check table info and constraints
    console.log('\n📋 Checking for potential issues...');
    
    // Try to get all records to see if RLS is filtering
    const { data: allRecords, error: allError } = await supabase
      .from('pending_crop_coefficients')
      .select('id, status, created_at')
      .limit(10);
    
    if (allError) {
      console.error('❌ Error getting all records:', allError);
    } else {
      console.log('📊 All accessible records:', allRecords?.length);
      allRecords?.forEach(record => {
        console.log(`  - ${record.id}: ${record.status}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

directDatabaseTest();