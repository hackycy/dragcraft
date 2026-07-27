import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const publicPackages = new Set([
  '@dragcraft/designer',
  '@dragcraft/device-frames',
  '@dragcraft/fields-ant-design-vue',
])
const packagePattern = /@dragcraft\/[a-z0-9-]+/g
const errors = []

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
  path.join(repoRoot, 'README.md'),
  ...collectFiles('docs', new Set(['.md', '.ts'])),
  ...collectFiles('examples', new Set(['.css', '.json', '.ts', '.vue'])),
  ...collectFiles('playground', new Set(['.css', '.json', '.ts', '.vue'])),
  ...collectFiles('skills/dragcraft', new Set(['.json', '.md'])),
]

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const lines = source.split('\n')
  for (const [index, line] of lines.entries()) {
    for (const packageName of line.match(packagePattern) ?? []) {
      if (!publicPackages.has(packageName))
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
