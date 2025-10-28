import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addStatusField() {
  try {
    console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('Adding status field to pending_crop_coefficients table...');
    
    // Since we can't easily check for column existence without direct DB access,
    // let's try to add the column and handle the error if it already exists
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE pending_crop_coefficients ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));`
    });
    
    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
        console.log('Status column already exists!');
      } else {
        console.error('Error adding status field:', error);
      }
    } else {
      console.log('Successfully added status field to pending_crop_coefficients table!');
    }
  } catch (err) {
    console.error('Failed to add status field:', err);
  }
}

addStatusField();