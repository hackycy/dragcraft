import { defineConfig } from 'tsdown'

const cssEntries = {
  structure: 'styles/structure.css',
  recipe: 'styles/recipe.css',
  styles: 'styles/index.css',
}

export default defineConfig([
  {
    name: 'ui:runtime',
    entry: { index: 'src/index.ts' },
    dts: true,
    publint: true,
  },
  ...Object.entries(cssEntries).map(([name, entry]) => ({
    name: `ui:${name}`,
    entry: { [name]: entry },
    platform: 'browser' as const,
    css: {
      fileName: `${name}.css`,
    },
  })),
])
