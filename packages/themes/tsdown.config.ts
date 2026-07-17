import { defineConfig } from 'tsdown'

const entries = {
  structure: 'src/structure.css',
  standard: 'src/standard/index.css',
  material: 'src/material/index.css',
}

const structurePackages = [
  /^@dragcraft\/designer(?:\/|$)/,
  /^@dragcraft\/renderer(?:\/|$)/,
  /^@dragcraft\/form-generator(?:\/|$)/,
]

export default defineConfig(Object.entries(entries).map(([name, entry]) => ({
  name: `themes:${name}`,
  entry: { [name]: entry },
  platform: 'browser' as const,
  noExternal: structurePackages,
  outputOptions: {
    cssEntryFileNames: '[name].css',
  },
  copy: name === 'structure'
    ? [
        { from: 'src/contract/theme-contract.json', to: 'dist/theme-contract.json' },
        { from: 'src/contract/css-custom-data.json', to: 'dist/css-custom-data.json' },
      ]
    : undefined,
})))
