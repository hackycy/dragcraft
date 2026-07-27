import { defineConfig } from 'tsdown'

const styleEntries = {
  standard: 'theme/standard.css',
  structure: 'theme/structure.css',
}

export default defineConfig([
  {
    name: 'designer:module',
    entry: { index: 'src/index.ts' },
    dts: true,
    publint: true,
  },
  ...Object.entries(styleEntries).map(([name, entry]) => ({
    name: `designer:styles:${name}`,
    entry: { [name]: entry },
    platform: 'browser' as const,
    css: {
      fileName: `styles/${name}.css`,
    },
    copy: name === 'structure'
      ? [
          'theme/contract/theme-contract.json',
          'theme/contract/css-custom-data.json',
        ]
      : undefined,
  })),
])
