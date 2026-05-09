import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://104.250.128.20',
        changeOrigin: true,
      },

      '/scorm': {
        target: 'http://104.250.128.20',
        changeOrigin: true,
      },

      
      '/uploads': {
        target: 'http://104.250.128.20',
        changeOrigin: true,
      }
    }
  }
})

