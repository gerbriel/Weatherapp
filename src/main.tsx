import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Environment validation for production
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
}

// Check if we're in development mode
const isDev = import.meta.env.DEV

if (!isDev) {
  console.log('🚀 Production mode detected')
  console.log('🔧 Environment check:', {
    hasSupabaseUrl: !!requiredEnvVars.VITE_SUPABASE_URL,
    hasSupabaseKey: !!requiredEnvVars.VITE_SUPABASE_ANON_KEY
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
