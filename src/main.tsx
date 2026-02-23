import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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
  
  const root = createRoot(rootElement)
  
  root.render(
    <App />
  )
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
