import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        guide: fileURLToPath(new URL('./index.html', import.meta.url)),
        minimal: fileURLToPath(new URL('./minimal.html', import.meta.url)),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 9982,
  },
})
