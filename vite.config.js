import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://104.250.128.20/api/',
        changeOrigin: true,
      },
      '/scorm/': {
        target: 'http://104.250.128.20/api/',
        changeOrigin: true,
      }
    }
  }
})
