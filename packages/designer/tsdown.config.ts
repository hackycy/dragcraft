import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  dts: true,
  exports: {
    customExports: exports => ({
      ...exports,
      './structure.css': './styles/structure.css',
    }),
  },
  publint: true,
})
