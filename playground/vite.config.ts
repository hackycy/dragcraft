import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@dragcraft/designer/standard.css': fileURLToPath(
        new URL('../packages/designer/theme/standard.css', import.meta.url),
      ),
      '@dragcraft/designer/structure.css': fileURLToPath(
        new URL('../packages/designer/theme/structure.css', import.meta.url),
      ),
      ...(command === 'serve'
        ? {
            '@dragcraft/designer': fileURLToPath(
              new URL('../packages/designer/src/index.ts', import.meta.url),
            ),
          }
        : {}),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 9981,
  },
}))
