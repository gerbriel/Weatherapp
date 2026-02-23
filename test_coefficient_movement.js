import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCoefficientMovement() {
  try {
    console.log('🧪 Testing coefficient movement between tabs...\n');
    
    // Check current state
    console.log('📊 Current state:');
    const pendingQuery = await supabase.from('pending_crop_coefficients').select('id, status').eq('status', 'pending');
    const approvedQuery = await supabase.from('pending_crop_coefficients').select('id, status').eq('status', 'approved');
    const rejectedQuery = await supabase.from('pending_crop_coefficients').select('id, status').eq('status', 'rejected');
    
    console.log(`- Pending: ${pendingQuery.data?.length || 0} items`);
    console.log(`- Approved: ${approvedQuery.data?.length || 0} items`);
    console.log(`- Rejected: ${rejectedQuery.data?.length || 0} items\n`);
    
    // Test approval flow
    if (pendingQuery.data && pendingQuery.data.length > 0) {
      const testId = pendingQuery.data[0].id;
      console.log(`✅ Testing approval: Moving coefficient ${testId} from pending to approved`);
      
      const { error: approveError } = await supabase
        .from('pending_crop_coefficients')
        .update({ status: 'approved' })
        .eq('id', testId);
      
      if (approveError) {
        console.error('❌ Error approving:', approveError);
      } else {
        console.log('✅ Successfully moved to approved');
        
        // Verify the move with a longer delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const verifyQuery = await supabase.from('pending_crop_coefficients').select('id, status').eq('id', testId).single();
        console.log(`📋 Verification: Status is now "${verifyQuery.data?.status}"`);
        
        if (verifyQuery.data?.status !== 'approved') {
          console.log('⚠️  Status change may not have persisted. Checking again...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const secondCheck = await supabase.from('pending_crop_coefficients').select('id, status').eq('id', testId).single();
          console.log(`📋 Second check: Status is "${secondCheck.data?.status}"`);
        }
      }
    }
    
    console.log('\n🔄 Updated counts:');
    const updatedPending = await supabase.from('pending_crop_coefficients').select('id').eq('status', 'pending');
    const updatedApproved = await supabase.from('pending_crop_coefficients').select('id').eq('status', 'approved');
    const updatedRejected = await supabase.from('pending_crop_coefficients').select('id').eq('status', 'rejected');
    
    console.log(`- Pending: ${updatedPending.data?.length || 0} items`);
    console.log(`- Approved: ${updatedApproved.data?.length || 0} items`);
    console.log(`- Rejected: ${updatedRejected.data?.length || 0} items`);
    
    console.log('\n✨ Test complete! Check the AdminPanel UI to see the changes.');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testCoefficientMovement();