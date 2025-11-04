import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/huggingface-transformers-react/example/' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  },
  define: {
    global: 'globalThis',
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
}) 