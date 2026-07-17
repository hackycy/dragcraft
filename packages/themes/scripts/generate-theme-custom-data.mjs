import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const packageRoot = path.resolve(import.meta.dirname, '..')
const manifestPath = path.join(packageRoot, 'src/contract/theme-contract.json')
const outputPath = path.join(packageRoot, 'src/contract/css-custom-data.json')

export function createCssCustomData(contract) {
  return {
    version: 1.1,
    properties: Object.entries(contract.tokens).map(([name, token]) => ({
      name,
      description: token.description,
      syntax: '*',
    })),
  }
}

export function generateThemeCustomData() {
  const contract = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const customData = createCssCustomData(contract)
  fs.writeFileSync(outputPath, `${JSON.stringify(customData, null, 2)}\n`)
}

if (process.argv[1] === import.meta.filename)
  generateThemeCustomData()
