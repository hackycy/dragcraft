import { defineConfig } from 'tsdown'

const entries = {
  structure: 'src/structure.css',
  standard: 'src/standard/index.css',
  material: 'src/material/index.css',
}

export default defineConfig(Object.entries(entries).map(([name, entry]) => ({
  name: `themes:${name}`,
  entry: { [name]: entry },
  platform: 'browser' as const,
  css: {
    fileName: `${name}.css`,
  },
  copy: name === 'structure'
    ? [
        'src/contract/theme-contract.json',
        'src/contract/css-custom-data.json',
      ]
    : undefined,
})))
