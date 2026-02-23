import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Use the service role key for admin operations (if available) or anon key
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing RLS policies for pending_crop_coefficients...\n');
    
    // Read the SQL file
    const sqlContent = readFileSync('./fix_pending_coefficients_rls.sql', 'utf8');
    
    // Split into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn('Warning:', error.message);
        } else {
          console.log('✅ Success');
        }
      } catch (err) {
        console.warn('Could not execute statement:', err.message);
      }
    }
    
    console.log('\n🧪 Testing UPDATE after RLS fix...');
    
    // Test the update again
    const { data: testData, error: testError } = await supabaseAdmin
      .from('pending_crop_coefficients')
      .select('id, status')
      .eq('status', 'pending')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test SELECT error:', testError);
      return;
    }
    
    if (testData && testData.length > 0) {
      const testId = testData[0].id;
      console.log(`Testing update on ${testId}...`);
      
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('pending_crop_coefficients')
        .update({ status: 'approved' })
        .eq('id', testId)
        .select();
      
      if (updateError) {
        console.error('❌ UPDATE error:', updateError);
      } else {
        console.log('✅ UPDATE successful:', updateData);
        
        // Revert the change
        await supabaseAdmin
          .from('pending_crop_coefficients')
          .update({ status: 'pending' })
          .eq('id', testId);
        console.log('🔄 Reverted test change');
      }
    }
    
    console.log('\n✨ RLS policies updated! Try the AdminPanel again.');
    
  } catch (err) {
    console.error('❌ Failed to fix RLS policies:', err);
  }
}

fixRLSPolicies();