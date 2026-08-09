import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const textExtensions = new Set(['.cjs', '.css', '.html', '.js', '.json', '.md', '.mdx', '.mjs', '.ts', '.tsx', '.txt', '.vue', '.yaml', '.yml'])
const forbidden = /\b(?:DesignerSchema|DesignerEngine|CommandType|createEngine|WidgetMeta|WidgetDefinition|ComponentMap|RootRenderer|LayoutPlan|NodeLayout|MaterialWidgetDefinition|WidgetGroupConfig|buildComponentMap|getWidgetMetas|createContainerPlan|engineOptions|widgetMetas|componentMap|fieldmaterials|DesignerMaterialDefinition|RendererMaterialDefinition)\b|root\.children|engine\.(?:store|state|execute|history|eventHub|exportSchema|importSchema|registerMigration)\b|@dragcraft\/(?:renderer|widgets|legacy-core)/g
const errors = []

function collect(relativePath) {
  const absolute = path.join(repoRoot, relativePath)
  const stat = fs.statSync(absolute)
  if (stat.isFile())
    return [absolute]
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
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
  path.join(repoRoot, 'packages/designer/src/index.ts'),
  ...collect('docs'),
  ...collect('.github/architecture'),
  ...collect('examples'),
  ...collect('playground'),
  ...collect('skills/dragcraft'),
]

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(forbidden))
      errors.push(`${path.relative(repoRoot, file)}:${index + 1} obsolete protocol ${match[0]}`)
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write('obsolete protocol denylist valid\n')
}
