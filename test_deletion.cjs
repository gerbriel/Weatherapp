const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fvymxoeupxojvdzqahuw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eW14b2V1cHhvanZkenFhaHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzg3OTMsImV4cCI6MjA3Njc1NDc5M30.0LtMT3zyVAEQmhwrIJR2eRe5RQqAs8iKWBhDt5XSVMo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeletion() {
  try {
    console.log('🧪 Testing coefficient deletion with audit trail...');
    
    // First, let's see what coefficients we have
    const { data: coefficients, error: fetchError } = await supabase
      .from('pending_crop_coefficients')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Error fetching coefficients:', fetchError);
      return;
    }
    
    console.log('📊 Available coefficients:', coefficients.length);
    
    if (coefficients.length === 0) {
      console.log('ℹ️ No coefficients available for testing');
      return;
    }
    
    // Find a coefficient to delete (preferably one that's not pending)
    const coefficientToDelete = coefficients.find(c => c.status !== 'pending') || coefficients[0];
    console.log('🎯 Selected coefficient for deletion:', {
      id: coefficientToDelete.id,
      crop_name: coefficientToDelete.crop_name,
      variety_name: coefficientToDelete.variety_name,
      status: coefficientToDelete.status
    });
    
    // Check audit records before deletion
    const { data: auditBefore, error: auditBeforeError } = await supabase
      .from('coefficient_audit_log')
      .select('*')
      .eq('coefficient_id', coefficientToDelete.id);
    
    if (auditBeforeError) {
      console.error('❌ Error fetching audit records before deletion:', auditBeforeError);
      return;
    }
    
    console.log('📝 Audit records before deletion:', auditBefore.length);
    
    // Now try to delete the coefficient
    console.log('🗑️ Attempting deletion...');
    const { error: deleteError } = await supabase
      .from('pending_crop_coefficients')
      .delete()
      .eq('id', coefficientToDelete.id);
    
    if (deleteError) {
      console.error('❌ Error deleting coefficient:', deleteError);
      return;
    }
    
    console.log('✅ Coefficient deleted successfully!');
    
    // Check audit records after deletion
    const { data: auditAfter, error: auditAfterError } = await supabase
      .from('coefficient_audit_log')
      .select('*')
      .eq('coefficient_id', coefficientToDelete.id);
    
    if (auditAfterError) {
      console.error('❌ Error fetching audit records after deletion:', auditAfterError);
      return;
    }
    
    console.log('📝 Audit records after deletion:', auditAfter.length);
    console.log('🎉 Deletion test completed successfully!');
    
    // Show the deletion audit record
    const deleteRecord = auditAfter.find(record => record.action_type === 'delete');
    if (deleteRecord) {
      console.log('📋 Deletion audit record:', {
        action_type: deleteRecord.action_type,
        change_reason: deleteRecord.change_reason,
        created_at: deleteRecord.created_at
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testDeletion();