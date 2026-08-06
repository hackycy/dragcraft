import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const violations = []
const ignoredDirectories = new Set(['.turbo', 'dist', 'node_modules'])

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name))
      return []
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath]
  })
}

for (const packageName of ['renderer', 'widgets']) {
  const packagePath = path.join(repoRoot, 'packages', packageName)
  if (fs.existsSync(packagePath))
    violations.push(`packages/${packageName} still exists`)
}

const designerManifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'packages/designer/package.json'), 'utf8'),
)
for (const packageName of ['@dragcraft/renderer', '@dragcraft/widgets']) {
  if (designerManifest.dependencies?.[packageName])
    violations.push(`packages/designer/package.json still depends on ${packageName}`)
}

const lockfile = fs.readFileSync(path.join(repoRoot, 'pnpm-lock.yaml'), 'utf8')
for (const packageName of ['renderer', 'widgets']) {
  if (lockfile.includes(`  packages/${packageName}:`))
    violations.push(`pnpm-lock.yaml still contains the packages/${packageName} importer`)
}

const coreRoot = path.join(repoRoot, 'packages/core')
const coreSourceRoot = path.join(coreRoot, 'src')
const retainedCoreSource = /^(?:index\.ts|definitions\/|document\/|editor\/|resolver\/)/
for (const file of collectFiles(coreSourceRoot)) {
  const relativePath = path.relative(coreSourceRoot, file)
  if (!retainedCoreSource.test(relativePath))
    violations.push(`packages/core/src/${relativePath} is an obsolete Core protocol file`)
}

const coreManifest = JSON.parse(
  fs.readFileSync(path.join(coreRoot, 'package.json'), 'utf8'),
)
for (const dependencySection of ['dependencies', 'devDependencies', 'peerDependencies']) {
  if (coreManifest[dependencySection]?.vue)
    violations.push(`packages/core/package.json ${dependencySection} still declares Vue`)
}

for (const file of collectFiles(coreSourceRoot)) {
  const source = fs.readFileSync(file, 'utf8')
  if (/from\s+['"](?:vue|@vue\/)/.test(source))
    violations.push(`${path.relative(repoRoot, file)} still imports Vue`)
}

const sourceExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.vue'])
const obsoletePackageReference
  = /@dragcraft\/(?:renderer|widgets)|(?:packages\/renderer|(?:\.\.\/)+renderer)\/styles\/structure\.css/
for (const sourceDirectory of ['packages', 'playground', 'examples', 'scripts']) {
  for (const file of collectFiles(path.join(repoRoot, sourceDirectory))) {
    if (!sourceExtensions.has(path.extname(file)))
      continue
    if (file === import.meta.filename)
      continue
    if (obsoletePackageReference.test(fs.readFileSync(file, 'utf8')))
      violations.push(`${path.relative(repoRoot, file)} references an obsolete package implementation`)
  }
}

const architecturePackageReference = fs.readFileSync(
  path.join(repoRoot, '.github/architecture/07-package-reference.md'),
  'utf8',
)
for (const packageName of ['@dragcraft/renderer', '@dragcraft/widgets']) {
  if (architecturePackageReference.includes(packageName))
    violations.push(`architecture package reference still lists ${packageName}`)
}

if (violations.length > 0) {
  process.stderr.write(`${violations.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write('obsolete package removal valid\n')
}
