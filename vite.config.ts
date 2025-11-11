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
    proxy: {
      // Proxy CMIS API requests to avoid CORS issues in development
      '/api/cmis': {
        target: 'https://et.water.ca.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cmis/, '/api/data'),
        secure: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Ensure proper file extensions and MIME types
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    // Fix MIME type issues
    target: 'es2020',
    minify: 'esbuild',
  },
  // Ensure proper module resolution
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}))
