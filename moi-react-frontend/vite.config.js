import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Proxy Google Input Tools API to avoid CORS issues in browser
      '/api/translit': {
        target: 'https://inputtools.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/translit/, '/request'),
        secure: true,
      },
    },
  },
})
