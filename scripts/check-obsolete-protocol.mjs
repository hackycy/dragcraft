import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const textExtensions = new Set(['.cjs', '.css', '.html', '.js', '.json', '.md', '.mdx', '.mjs', '.ts', '.tsx', '.txt', '.vue', '.yaml', '.yml'])
const strict = process.argv.includes('--strict')
const inventory = process.argv.includes('--inventory')
const fixtureFlagIndex = process.argv.indexOf('--fixture')
const fixturePaths = fixtureFlagIndex === -1
  ? []
  : process.argv.slice(fixtureFlagIndex + 1).filter(argument => !argument.startsWith('--'))
const forbiddenIdentifiers = 'DesignerSchema|DesignerEngine|CommandType|createEngine|SchemaNode|WidgetMeta|WidgetDefinition|ComponentMap|RootRenderer|LayoutPlan|NodeLayout|ResolvedNodeLayout|ContainerPlan|RendererExtensions|RendererEventHooks|MaterialWidgetDefinition|WidgetGroupConfig|buildComponentMap|getWidgetMetas|createContainerPlan|engineOptions|widgetMetas|componentMap|fieldmaterials|DesignerMaterialDefinition|RendererMaterialDefinition|MaterialPresentationLayout|MaterialPresentationPlacement|ResolvedPresentationLayout|ResolvedPresentationPlacement|sortScope|placement|flow|chrome|layer'
const obsoletePublicIdentifiers = 'ContainerRegionOutlet|DesignerSchema'
const forbiddenPackages = ['renderer', 'widgets', 'legacy-core'].join('|')
const forbidden = new RegExp(`\\b(?:${forbiddenIdentifiers})\\b|root\\.children|@dragcraft\\/(?:${forbiddenPackages})`, 'g')
const obsoletePublic = new RegExp(`\\b(?:${obsoletePublicIdentifiers})\\b`, 'g')
const errors = []
const permitted = []

function relativePathFor(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/')
}

function collect(relativePath, { includeTests = false } = {}) {
  const absolute = path.join(repoRoot, relativePath)
  const stat = fs.statSync(absolute)
  if (stat.isFile())
    return [absolute]
  return fs.readdirSync(absolute, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name)).flatMap((entry) => {
    if (
      entry.name === 'dist'
      || entry.name === 'node_modules'
      || entry.name === '.scratch'
      || (entry.name === 'cache' && relativePathFor(absolute) === 'docs/.vitepress')
    ) {
      return []
    }
    const child = path.join(absolute, entry.name)
    if (entry.isDirectory())
      return collect(path.relative(repoRoot, child), { includeTests })
    if (!textExtensions.has(path.extname(entry.name)) || (!includeTests && /\.test\.[^.]+$/.test(entry.name)))
      return []
    return [child]
  })
}

const files = fixturePaths.length > 0
  ? fixturePaths.map(relativePath => path.resolve(repoRoot, relativePath))
  : [
      path.join(repoRoot, 'README.md'),
      path.join(repoRoot, 'package.json'),
      path.join(repoRoot, 'pnpm-lock.yaml'),
      path.join(repoRoot, 'pnpm-workspace.yaml'),
      path.join(repoRoot, 'turbo.json'),
      ...collect('packages'),
      ...collect('docs'),
      ...collect('.github/architecture'),
      ...collect('examples'),
      ...collect('playground'),
      ...collect('skills/dragcraft'),
      ...collect('scripts'),
    ]

const contractTestFiles = fixturePaths.length > 0
  ? []
  : [
      ...collect('packages', { includeTests: true }),
      ...collect('examples', { includeTests: true }),
      ...collect('playground', { includeTests: true }),
    ].filter(file => /\.test\.[^.]+$/.test(file))

function isScannerControlFile(relativePath) {
  return relativePath === 'scripts/check-obsolete-protocol.mjs'
    || relativePath === 'scripts/check-obsolete-protocol-fixtures.test.mjs'
    || (!fixturePaths.length && relativePath.startsWith('scripts/fixtures/'))
}

function isExplicitLocalExternalRuntime(relativePath) {
  return relativePath.startsWith('examples/guide-project/src/runtime/')
}

function assignedGate(relativePath) {
  if (isExplicitLocalExternalRuntime(relativePath))
    return 'G7'
  if (relativePath.startsWith('docs/') || relativePath.startsWith('.github/architecture/') || relativePath.startsWith('skills/'))
    return 'G7'
  if (relativePath.startsWith('playground/tests/') || relativePath.endsWith('.test.ts') || relativePath.endsWith('.test.mjs'))
    return 'G8'
  if (relativePath.startsWith('packages/core/'))
    return 'G1'
  if (relativePath.startsWith('packages/designer/src/session/'))
    return 'G1'
  if (relativePath.includes('/authoring/') || relativePath.includes('/schema-editor/') || relativePath.includes('/operations/'))
    return 'G2'
  if (relativePath.includes('/node-host') || relativePath.includes('/toolbar') || relativePath.includes('/interaction'))
    return 'G3'
  if (relativePath.includes('/region'))
    return 'G4'
  if (relativePath.includes('/canvas-surface') || relativePath.includes('/application-surface') || relativePath.includes('/presentation/context'))
    return 'G5'
  if (relativePath.startsWith('packages/designer/') || relativePath.startsWith('packages/device-frames/'))
    return 'G6'
  if (relativePath.startsWith('examples/') || relativePath.startsWith('playground/'))
    return 'G7'
  return 'G9'
}

function isIntentionalInternalIdentifier(file, match, line) {
  const relativePath = relativePathFor(file)
  if (match === 'ContainerRegionOutlet' && relativePath.startsWith('packages/designer/src/presentation/'))
    return true
  return relativePath === 'packages/designer/src/public-interface.test.ts'
    && /\.not\.toHaveProperty/.test(line)
}

function scanFile(file, includePublicNames) {
  const relativePath = relativePathFor(file)
  if (isScannerControlFile(relativePath))
    return

  const lines = fs.readFileSync(file, 'utf8').split('\n')
  for (const [index, line] of lines.entries()) {
    forbidden.lastIndex = 0
    for (const match of line.matchAll(forbidden)) {
      if (isIntentionalInternalIdentifier(file, match[0], line))
        continue
      const finding = `${relativePath}:${index + 1} [${assignedGate(relativePath)}] obsolete protocol ${match[0]}`
      if (isExplicitLocalExternalRuntime(relativePath))
        permitted.push(`${relativePath}:${index + 1} [G7] permitted local external runtime policy ${match[0]}`)
      else
        errors.push(finding)
    }
    if (!includePublicNames)
      continue
    obsoletePublic.lastIndex = 0
    for (const match of line.matchAll(obsoletePublic)) {
      if (!isIntentionalInternalIdentifier(file, match[0], line))
        errors.push(`${relativePath}:${index + 1} [${assignedGate(relativePath)}] obsolete public name ${match[0]}`)
    }
  }
}

for (const file of files.sort((left, right) => left.localeCompare(right)))
  scanFile(file, true)
for (const file of contractTestFiles.sort((left, right) => left.localeCompare(right)))
  scanFile(file, true)

if (errors.length > 0) {
  const output = `${errors.join('\n')}\n`
  if (strict || !inventory) {
    process.stderr.write(output)
    process.exitCode = 1
  }
  else {
    process.stdout.write(`obsolete protocol inventory (${errors.length} prohibited findings, ${permitted.length} permitted local external-runtime findings)\n${output}${permitted.join('\n')}${permitted.length > 0 ? '\n' : ''}`)
  }
}
else {
  process.stdout.write(`obsolete protocol denylist valid (0 prohibited findings, ${permitted.length} permitted local external-runtime findings)\n${permitted.join('\n')}${permitted.length > 0 ? '\n' : ''}`)
}
