import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/styles/index.css',
  ],
  css: {
    fileName: 'styles/index.css',
  },
  dts: true,
})
