import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function quickTest() {
  console.log('🔍 Quick database update test...');
  
  // Get any pending record
  const { data: pending } = await supabase
    .from('pending_crop_coefficients')
    .select('id, status')
    .eq('status', 'pending')
    .limit(1);
  
  if (!pending || pending.length === 0) {
    console.log('No pending records to test with');
    return;
  }
  
  const testId = pending[0].id;
  console.log(`Testing with record: ${testId}`);
  
  // Try to update
  const { data: updateResult, error } = await supabase
    .from('pending_crop_coefficients')
    .update({ 
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', testId)
    .select();
  
  console.log('Update result:', { updateResult, error });
  
  // Check if it actually changed
  const { data: verify } = await supabase
    .from('pending_crop_coefficients')
    .select('id, status')
    .eq('id', testId)
    .single();
  
  console.log('Verification:', verify);
  
  if (verify?.status === 'approved') {
    console.log('✅ SUCCESS: Update worked!');
    // Revert
    await supabase
      .from('pending_crop_coefficients')
      .update({ status: 'pending' })
      .eq('id', testId);
  } else {
    console.log('❌ FAILED: Update did not persist - RLS is blocking it');
    console.log('\n🔧 SOLUTION: Run this SQL in Supabase Dashboard:');
    console.log('ALTER TABLE pending_crop_coefficients DISABLE ROW LEVEL SECURITY;');
  }
}

quickTest();