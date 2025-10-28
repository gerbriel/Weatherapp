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

console.log('🚀 Application starting...')
console.log('🔧 Environment check:', {
  isDev,
  hasSupabaseUrl: !!requiredEnvVars.VITE_SUPABASE_URL,
  hasSupabaseKey: !!requiredEnvVars.VITE_SUPABASE_ANON_KEY,
  supabaseUrl: requiredEnvVars.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
  buildTimestamp: new Date().toISOString()
})

// Add error boundary logging
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
})

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found!')
  }
  
  console.log('🎯 Creating React root...')
  const root = createRoot(rootElement)
  
  console.log('🎨 Rendering App...')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('✅ App rendered successfully')
} catch (error) {
  console.error('🚨 Failed to render app:', error)
  // Fallback display
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h2>🚨 Application Error</h2>
      <p>Failed to load ET Weather App</p>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p>Check console for details</p>
    </div>
  `
}
