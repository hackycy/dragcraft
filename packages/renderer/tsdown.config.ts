import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    structure: 'styles/structure.css',
  },
  css: {
    fileName: 'structure.css',
  },
  dts: true,
  publint: true,
})
