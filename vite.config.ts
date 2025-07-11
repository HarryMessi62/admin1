import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://infocryptox.com',
        // target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
