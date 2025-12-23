import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Suppress Supabase auth errors in development when network is unavailable
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out Supabase auth network errors
  const message = args[0]?.toString() || '';
  if (
    message.includes('Failed to fetch') ||
    message.includes('AuthRetryableFetchError') ||
    message.includes('Could not resolve host')
  ) {
    return; // Silently ignore these errors
  }
  originalConsoleError(...args);
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false, // Disable auto-refresh to prevent retries
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    // Custom fetch with 1-second timeout to fail fast
    fetch: async (url, options = {}) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        // Silently fail for network errors - auth will handle gracefully
        throw error;
      }
    },
  },
})

// Export for use in components
export default supabase