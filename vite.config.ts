
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths
  server: {
    host: true, // Expose to network (0.0.0.0)
    hmr: {
      clientPort: 443, // Force HMR to use standard HTTPS port to bypass CORS/firewalls
    },
    cors: {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      preflightContinue: true,
      optionsSuccessStatus: 204
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    // Fix for "Blocked request" error when using Cloudflare or Tunnels
    allowedHosts: true
  },
})
