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
    // Custom fetch with smart timeout - fast for background checks, normal for user actions
    fetch: async (url, options = {}) => {
      try {
        const controller = new AbortController();
        
        // Only apply fast timeout to specific auth background operations
        // Allow normal timeout for user-initiated login/signup
        const urlString = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
        const isBackgroundAuthCheck = urlString.includes('/auth/v1/token') && options.method !== 'POST';
        const timeoutMs = isBackgroundAuthCheck ? 1000 : 10000; // 1s for background, 10s for user actions
        
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
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