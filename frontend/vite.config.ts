import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Gunakan localhost untuk komunikasi internal yang lebih andal di lingkungan dev
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
})
