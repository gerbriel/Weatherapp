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
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      // Proxy CIMIS API requests to avoid CORS issues in development.
      // New CIMIS REST API uses header auth (Ocp-Apim-Subscription-Key).
      '/api/cmis': {
        target: 'https://et.water.ca.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cmis/, '/StationWeb/GetDataByStationNumber'),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('CMIS Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Inject the CIMIS subscription key as a header so the key
            // is never exposed as a query param in the browser.
            const key = process.env.VITE_CMIS_API_KEY;
            if (key) proxyReq.setHeader('Ocp-Apim-Subscription-Key', key);
            console.log('→ Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('← Response:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps to prevent base64 issues
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Ensure proper file extensions and MIME types
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        // Prevent dynamic imports that could cause base64 issues
        format: 'es',
      },
    },
    // Fix MIME type issues and prevent base64 generation
    target: 'es2020',
    minify: 'esbuild',
    // Prevent problematic dynamic imports
    modulePreload: false,
  },
  // Ensure proper module resolution
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}))
