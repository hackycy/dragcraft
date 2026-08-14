import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const textExtensions = new Set(['.cjs', '.css', '.html', '.js', '.json', '.md', '.mdx', '.mjs', '.ts', '.tsx', '.txt', '.vue', '.yaml', '.yml'])
const strict = process.argv.includes('--strict')
const inventory = process.argv.includes('--inventory')
const forbidden = /\b(?:DesignerSchema|DesignerEngine|CommandType|createEngine|SchemaNode|WidgetMeta|WidgetDefinition|ComponentMap|RootRenderer|LayoutPlan|NodeLayout|ResolvedNodeLayout|ContainerPlan|RendererExtensions|RendererEventHooks|MaterialWidgetDefinition|WidgetGroupConfig|buildComponentMap|getWidgetMetas|createContainerPlan|engineOptions|widgetMetas|componentMap|fieldmaterials|DesignerMaterialDefinition|RendererMaterialDefinition)\b|root\.children|@dragcraft\/(?:renderer|widgets|legacy-core)/g
const errors = []

function collect(relativePath) {
  const absolute = path.join(repoRoot, relativePath)
  const stat = fs.statSync(absolute)
  if (stat.isFile())
    return [absolute]
  return fs.readdirSync(absolute, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name)).flatMap((entry) => {
    if (
      entry.name === 'dist'
      || entry.name === 'node_modules'
      || entry.name === '.scratch'
      || (entry.name === 'cache' && path.relative(repoRoot, absolute) === 'docs/.vitepress')
    ) {
      return []
    }
    const child = path.join(absolute, entry.name)
    if (entry.isDirectory())
      return collect(path.relative(repoRoot, child))
    if (!textExtensions.has(path.extname(entry.name)) || /\.test\.[^.]+$/.test(entry.name))
      return []
    return [child]
  })
}

const files = [
  path.join(repoRoot, 'README.md'),
  ...collect('packages/designer/src'),
  ...collect('docs'),
  ...collect('.github/architecture'),
  ...collect('examples'),
  ...collect('playground'),
  ...collect('skills/dragcraft'),
]

for (const file of files.sort((left, right) => left.localeCompare(right))) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  for (const [index, line] of lines.entries()) {
    forbidden.lastIndex = 0
    for (const match of line.matchAll(forbidden))
      errors.push(`${path.relative(repoRoot, file)}:${index + 1} obsolete protocol ${match[0]}`)
  }
}

if (errors.length > 0) {
  const output = `${errors.join('\n')}\n`
  if (strict || !inventory) {
    process.stderr.write(output)
    process.exitCode = 1
  }
  else {
    process.stdout.write(`obsolete protocol inventory (${errors.length} findings)\n${output}`)
  }
}
else {
  process.stdout.write('obsolete protocol denylist valid (0 findings)\n')
}
