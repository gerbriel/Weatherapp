import React, { useState } from 'react';
import { Bug, Send, Database, Mail } from 'lucide-react';

const EmailDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const checkEnvironment = () => {
    const info = [];
    info.push('🔧 Environment Check:');
    info.push(`- Supabase URL: ${import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
    info.push(`- Supabase Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);
    info.push(`- Current Time: ${new Date().toISOString()}`);
    
    setDebugInfo(info.join('\n'));
  };

  const checkSubscriptions = async () => {
    setIsLoading(true);
    const info = ['🔍 Checking Subscriptions:'];
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        info.push('❌ Supabase environment variables not configured');
        setDebugInfo(info.join('\n'));
        setIsLoading(false);
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check recent one-time subscriptions
      const { data: oneTimeSubscriptions, error: oneTimeError } = await supabase
        .from('email_subscriptions')
        .select('*')
        .eq('is_recurring', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (oneTimeError) {
        info.push(`❌ Error fetching one-time subscriptions: ${oneTimeError.message}`);
      } else {
        info.push(`📧 Recent one-time subscriptions: ${oneTimeSubscriptions?.length || 0}`);
        oneTimeSubscriptions?.forEach((sub, index) => {
          const status = sub.last_sent_at ? 'SENT' : 'PENDING';
          info.push(`   ${index + 1}. ${sub.email} - ${status} (next_send_at: ${sub.next_send_at})`);
        });
      }
      
      // Check subscriptions due for sending
      const now = new Date().toISOString();
      const { data: dueSubscriptions, error: dueError } = await supabase
        .from('email_subscriptions')
        .select('*')
        .eq('enabled', true)
        .lte('next_send_at', now);
      
      if (dueError) {
        info.push(`❌ Error fetching due subscriptions: ${dueError.message}`);
      } else {
        info.push(`⏰ Subscriptions due for sending: ${dueSubscriptions?.length || 0}`);
      }
      
    } catch (error) {
      info.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setDebugInfo(info.join('\n'));
    setIsLoading(false);
  };

  const triggerEmailFunction = async () => {
    setIsLoading(true);
    const info = ['🚀 Triggering Email Function:'];
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        info.push('❌ Supabase environment variables not configured');
        setDebugInfo(info.join('\n'));
        setIsLoading(false);
        return;
      }
      
      const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-weather-emails`;
      info.push(`📡 Calling: ${emailFunctionUrl}`);
      
      const response = await fetch(emailFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          trigger: 'debug_test',
          timestamp: new Date().toISOString()
        })
      });
      
      info.push(`📊 Status: ${response.status}`);
      
      const result = await response.json();
      info.push(`📄 Response: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      info.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setDebugInfo(info.join('\n'));
    setIsLoading(false);
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Bug className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Debug Tools</h3>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={checkEnvironment}
          disabled={isLoading}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Database className="h-4 w-4 mr-1" />
          Check Environment
        </button>
        
        <button
          onClick={checkSubscriptions}
          disabled={isLoading}
          className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          <Mail className="h-4 w-4 mr-1" />
          Check Subscriptions
        </button>
        
        <button
          onClick={triggerEmailFunction}
          disabled={isLoading}
          className="flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4 mr-1" />
          Trigger Email Function
        </button>
      </div>
      
      {debugInfo && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm whitespace-pre-line max-h-96 overflow-y-auto">
          {debugInfo}
        </div>
      )}
      
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Running debug check...</p>
        </div>
      )}
    </div>
  );
};

export default EmailDebugger;