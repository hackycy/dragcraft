import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = path.resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
const expectedExports = {
  '.': './dist/index.mjs',
  './package.json': './package.json',
  './css-custom-data.json': './dist/css-custom-data.json',
  './standard.css': './dist/styles/standard.css',
  './structure.css': './dist/styles/structure.css',
  './theme-contract.json': './dist/theme-contract.json',
}
const errors = []

for (const [entry, expectedTarget] of Object.entries(expectedExports)) {
  if (packageJson.exports?.[entry] !== expectedTarget) {
    errors.push(`${entry} must target ${expectedTarget}`)
    continue
  }

  const packageEntry = entry === '.' ? packageJson.name : `${packageJson.name}/${entry.slice(2)}`
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

for (const [field, expected] of Object.entries({
  main: './dist/index.mjs',
  module: './dist/index.mjs',
  types: './dist/index.d.mts',
})) {
  if (packageJson[field] !== expected)
    errors.push(`${field} must target ${expected}`)
  else if (!fs.existsSync(path.join(packageRoot, expected.slice(2))))
    errors.push(`${field} targets missing file ${expected}`)
}

const expectedRuntimeExports = [
  'DOCUMENT_SCHEMA_VERSION',
  'DcDesigner',
  'DesignerRegionOutlet',
  'DesignerViewportPortal',
  'createDesigner',
  'defineMaterial',
  'useDesigner',
  'useSurfaceReservation',
]
const rootEntry = path.join(packageRoot, 'dist/index.mjs')
if (fs.existsSync(rootEntry)) {
  const module = await import(`${pathToFileURL(rootEntry).href}?phase5-package-validation`)
  const actual = Object.keys(module).sort()
  if (JSON.stringify(actual) !== JSON.stringify(expectedRuntimeExports))
    errors.push(`root runtime exports are ${JSON.stringify(actual)}, expected ${JSON.stringify(expectedRuntimeExports)}`)
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write('designer package exports valid\n')
}
