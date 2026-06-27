import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    watch: {
      ignored: ['**/server/**']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[Vite Proxy Error]:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Vite Proxy Request]:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Vite Proxy Response]:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
