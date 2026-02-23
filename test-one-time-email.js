// Test script to manually trigger the email function and check one-time emails
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

async function testOneTimeEmail() {
  console.log('🧪 Testing One-Time Email Functionality\n');
  
  try {
    // 1. Check for any pending subscriptions
    console.log('1. Checking for pending one-time subscriptions...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: subscriptions, error: fetchError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('enabled', true)
      .eq('is_recurring', false)
      .gte('next_send_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching subscriptions:', fetchError);
      return;
    }
    
    console.log(`   Found ${subscriptions?.length || 0} recent one-time subscriptions`);
    
    if (subscriptions && subscriptions.length > 0) {
      console.log('   Recent subscriptions:');
      subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.email} - ${sub.name} (next_send_at: ${sub.next_send_at})`);
      });
    }
    
    // 2. Try to manually trigger the email function
    console.log('\n2. Manually triggering email function...');
    const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-weather-emails`;
    console.log(`   Function URL: ${emailFunctionUrl}`);
    
    const response = await fetch(emailFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        trigger: 'manual_test',
        timestamp: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Email function triggered successfully!');
      console.log(`   Response:`, result);
      
      if (result.success_count > 0) {
        console.log(`   📧 Successfully sent ${result.success_count} emails`);
      }
      if (result.failure_count > 0) {
        console.log(`   ❌ Failed to send ${result.failure_count} emails`);
      }
    } else {
      console.log('❌ Email function failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error:`, result);
    }
    
    // 3. Check subscription status after triggering
    console.log('\n3. Checking subscription status after trigger...');
    const { data: updatedSubs, error: updateError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('is_recurring', false)
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (!updateError && updatedSubs) {
      console.log('   Recent one-time subscription statuses:');
      updatedSubs.forEach((sub, index) => {
        const status = sub.last_sent_at ? 'SENT' : 'PENDING';
        console.log(`   ${index + 1}. ${sub.email} - ${status} (last_sent: ${sub.last_sent_at || 'never'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOneTimeEmail().catch(console.error);