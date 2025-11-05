import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Weatherapp/' : '/', // Use root for dev, Weatherapp for production build
  server: {
    port: 5173,
    strictPort: false,
    host: true, // Allow external connections
    hmr: true, // Let Vite handle HMR automatically
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}))
