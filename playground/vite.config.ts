import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 9981,
  },
})
