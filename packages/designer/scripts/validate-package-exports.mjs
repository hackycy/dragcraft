import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
const expectedExports = {
  './css-custom-data.json': './dist/css-custom-data.json',
  './styles': './dist/styles/standard.css',
  './styles/structure': './dist/styles/structure.css',
  './theme-contract.json': './dist/theme-contract.json',
}
const errors = []

for (const [entry, expectedTarget] of Object.entries(expectedExports)) {
  if (packageJson.exports?.[entry] !== expectedTarget) {
    errors.push(`${entry} must target ${expectedTarget}`)
    continue
  }

  const packageEntry = `${packageJson.name}/${entry.slice(2)}`
  const expectedPath = path.join(packageRoot, expectedTarget.slice(2))
  try {
    const resolvedPath = fileURLToPath(import.meta.resolve(packageEntry))
    if (resolvedPath !== expectedPath)
      errors.push(`${packageEntry} resolved to ${resolvedPath}, expected ${expectedPath}`)
    else if (!fs.existsSync(resolvedPath))
      errors.push(`${packageEntry} resolved to missing file ${resolvedPath}`)
  }
  catch (error) {
    errors.push(`${packageEntry} failed to resolve: ${error.message}`)
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write('designer package exports valid\n')
}
