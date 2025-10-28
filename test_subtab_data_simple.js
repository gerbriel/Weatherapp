import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSubTabData() {
  try {
    console.log('Testing sub-tab data...');
    
    // Check pending coefficients (simplified query)
    const { data: pendingData, error: pendingError } = await supabase
      .from('pending_crop_coefficients')
      .select('*')
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Error fetching pending:', pendingError);
    } else {
      console.log(`Found ${pendingData.length} pending coefficients`);
    }
    
    // Check approved coefficients
    const { data: approvedData, error: approvedError } = await supabase
      .from('pending_crop_coefficients')
      .select('*')
      .eq('status', 'approved');
    
    if (approvedError) {
      console.error('Error fetching approved:', approvedError);
    } else {
      console.log(`Found ${approvedData.length} approved coefficients`);
    }
    
    // Check rejected coefficients
    const { data: rejectedData, error: rejectedError } = await supabase
      .from('pending_crop_coefficients')
      .select('*')
      .eq('status', 'rejected');
    
    if (rejectedError) {
      console.error('Error fetching rejected:', rejectedError);
    } else {
      console.log(`Found ${rejectedData.length} rejected coefficients`);
    }
    
    console.log('\nTest creating approved and rejected coefficients for demonstration...');
    
    // Get the first pending coefficient to duplicate
    if (pendingData && pendingData.length > 0) {
      const firstPending = pendingData[0];
      
      // Create an approved version (only if we don't have any approved yet)
      if (approvedData.length === 0) {
        const { error: approvedInsertError } = await supabase
          .from('pending_crop_coefficients')
          .insert({
            crop_variety_id: firstPending.crop_variety_id,
            kc_initial: firstPending.kc_initial,
            kc_development: firstPending.kc_development,
            kc_mid: firstPending.kc_mid,
            kc_late: firstPending.kc_late,
            initial_stage_days: firstPending.initial_stage_days,
            development_stage_days: firstPending.development_stage_days,
            mid_stage_days: firstPending.mid_stage_days,
            late_stage_days: firstPending.late_stage_days,
            source: 'Test approved coefficient',
            submitted_by_email: 'test@example.com',
            submitted_by_name: 'Test User',
            status: 'approved'
          });
        
        if (approvedInsertError) {
          console.error('Error creating approved test:', approvedInsertError);
        } else {
          console.log('✓ Created approved test coefficient');
        }
      }
      
      // Create a rejected version (only if we don't have any rejected yet)
      if (rejectedData.length === 0) {
        const { error: rejectedInsertError } = await supabase
          .from('pending_crop_coefficients')
          .insert({
            crop_variety_id: firstPending.crop_variety_id,
            kc_initial: firstPending.kc_initial + 0.1,
            kc_development: firstPending.kc_development + 0.1,
            kc_mid: firstPending.kc_mid + 0.1,
            kc_late: firstPending.kc_late + 0.1,
            initial_stage_days: firstPending.initial_stage_days,
            development_stage_days: firstPending.development_stage_days,
            mid_stage_days: firstPending.mid_stage_days,
            late_stage_days: firstPending.late_stage_days,
            source: 'Test rejected coefficient',
            submitted_by_email: 'test@example.com',
            submitted_by_name: 'Test User',
            status: 'rejected'
          });
        
        if (rejectedInsertError) {
          console.error('Error creating rejected test:', rejectedInsertError);
        } else {
          console.log('✓ Created rejected test coefficient');
        }
      }
    }
    
    console.log('\nNow you should see sub-tabs with counts in the AdminPanel!');
    
  } catch (err) {
    console.error('Failed to test data:', err);
  }
}

testSubTabData();