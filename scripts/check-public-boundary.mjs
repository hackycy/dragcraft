import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const publicPackages = new Set([
  '@dragcraft/designer',
  '@dragcraft/device-frames',
])
const publicPackagePrefixes = ['@dragcraft/fields-']
const packagePattern = /@dragcraft\/[a-z0-9-]+/g
const publicTextExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsonc',
  '.jsx',
  '.less',
  '.md',
  '.mdx',
  '.mjs',
  '.sass',
  '.scss',
  '.ts',
  '.tsx',
  '.txt',
  '.vue',
  '.yaml',
  '.yml',
])
const errors = []

function isPublicPackage(packageName) {
  return publicPackages.has(packageName)
    || publicPackagePrefixes.some(prefix => packageName.startsWith(prefix))
}

function collectFiles(relativePath, extensions) {
  const absolutePath = path.join(repoRoot, relativePath)
  const stat = fs.statSync(absolutePath)
  if (stat.isFile())
    return [absolutePath]

  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'dist' || entry.name === 'node_modules')
      return []
    const child = path.join(absolutePath, entry.name)
    if (entry.isDirectory())
      return collectFiles(path.relative(repoRoot, child), extensions)
    return extensions.has(path.extname(entry.name)) ? [child] : []
  })
}

const files = [
  path.join(repoRoot, 'CLAUDE.md'),
  path.join(repoRoot, 'README.md'),
  ...collectFiles('docs', publicTextExtensions)
    .filter(file => file !== path.join(repoRoot, 'docs/package.json')),
  ...collectFiles('examples', publicTextExtensions),
  ...collectFiles('playground', publicTextExtensions),
  ...collectFiles('packages/designer/fixtures/public-consumer', publicTextExtensions),
  ...collectFiles('skills/dragcraft', publicTextExtensions),
]

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const lines = source.split('\n')
  for (const [index, line] of lines.entries()) {
    for (const packageName of line.match(packagePattern) ?? []) {
      if (!isPublicPackage(packageName))
        errors.push(`${path.relative(repoRoot, file)}:${index + 1} references internal package ${packageName}`)
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write('public package boundary valid\n')
}
