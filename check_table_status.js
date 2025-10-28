import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAndUpdateData() {
  try {
    console.log('Checking pending_crop_coefficients table...');
    
    // First, let's check if we can access the table and see its structure
    const { data: testData, error: testError } = await supabase
      .from('pending_crop_coefficients')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Error accessing table:', testError);
      return;
    }
    
    console.log('Sample record:', testData?.[0]);
    
    // Check if any records have a status field
    if (testData?.[0] && 'status' in testData[0]) {
      console.log('Status field already exists!');
    } else {
      console.log('Status field does not exist yet.');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log('ALTER TABLE pending_crop_coefficients ADD COLUMN status text DEFAULT \'pending\' CHECK (status IN (\'pending\', \'approved\', \'rejected\'));');
    }
    
  } catch (err) {
    console.error('Failed to check table:', err);
  }
}

checkAndUpdateData();