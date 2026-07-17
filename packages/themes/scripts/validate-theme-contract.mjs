import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'
import { createCssCustomData } from './generate-theme-custom-data.mjs'

const packageRoot = path.resolve(import.meta.dirname, '..')
const repoRoot = path.resolve(packageRoot, '../..')
const contractPath = path.join(packageRoot, 'src/contract/theme-contract.json')
const customDataPath = path.join(packageRoot, 'src/contract/css-custom-data.json')
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const errors = []
const structureEntries = [
  '@dragcraft/designer/structure.css',
  '@dragcraft/renderer/structure.css',
  '@dragcraft/form-generator/structure.css',
]

const knownTokens = new Set(Object.keys(contract.tokens))
const integrationProperties = new Set(Object.keys(contract.integrationProperties))
const knownProperties = new Set([...knownTokens, ...integrationProperties])
const knownComponents = new Set(Object.keys(contract.components))
const knownParts = new Set(Object.values(contract.components).flatMap(component => component.parts))
const knownStates = new Set(Object.values(contract.components).flatMap(component => component.states))

function readCss(relativePath) {
  const absolutePath = path.resolve(packageRoot, relativePath)
  return postcss.parse(fs.readFileSync(absolutePath, 'utf8'), { from: absolutePath })
}

function report(node, message) {
  const source = node.source?.input.file
    ? path.relative(repoRoot, node.source.input.file)
    : 'unknown'
  errors.push(`${source}:${node.source?.start?.line ?? 0} ${message}`)
}

function isInsideKeyframes(rule) {
  let current = rule.parent
  while (current) {
    if (current.type === 'atrule' && /keyframes$/i.test(current.name))
      return true
    current = current.parent
  }
  return false
}

function validatePublicProperties(root) {
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--dc-') && !knownProperties.has(decl.prop))
      report(decl, `declares unknown public property ${decl.prop}`)

    const referenced = decl.value.match(/--dc-[a-z0-9-]+/g) ?? []
    for (const property of referenced) {
      if (!knownProperties.has(property))
        report(decl, `uses unknown public property ${property}`)
    }
  })
}

function validateRecipe(relativePath) {
  const root = readCss(relativePath)
  validatePublicProperties(root)
  const inheritableProperties = /^(?:color|font(?:-.+)?|letter-spacing|line-height|text-align)$/
  const contentBoundaryComponents = /data-dc-component=["'](?:designer|root-renderer|canvas|node|container-shell)["']/

  root.walkDecls((decl) => {
    if (decl.important)
      report(decl, 'visual recipes must not use !important')
  })

  root.walkRules((rule) => {
    if (isInsideKeyframes(rule))
      return
    if (!rule.selector.trim().startsWith('[data-dc-component='))
      report(rule, `recipe selector must begin with a public data-dc-component scope: ${rule.selector}`)
    if (rule.selector.includes('data-dc-node-surface'))
      report(rule, 'workbench recipes must not enter the business-content surface')

    if (contentBoundaryComponents.test(rule.selector)) {
      for (const decl of rule.nodes.filter(node => node.type === 'decl')) {
        if (inheritableProperties.test(decl.prop))
          report(decl, `${decl.prop} on a content-boundary ancestor would leak into business widgets`)
      }
    }

    selectorParser((selectors) => {
      selectors.walkClasses(classNode => report(rule, `recipe selector reaches private class .${classNode.value}`))
      selectors.walkUniversals(() => report(rule, 'workbench recipes must not use universal selectors'))
      selectors.walkPseudos((pseudo) => {
        if (pseudo.value === ':where')
          report(rule, 'recipe selectors must use normal specificity; zero-specificity grouping is not allowed')
      })
      selectors.walkAttributes((attribute) => {
        const value = attribute.value
        if (!value)
          return
        if (attribute.attribute === 'data-dc-component' && !knownComponents.has(value))
          report(rule, `selector references unknown component ${value}`)
        if (attribute.attribute === 'data-dc-part' && !knownParts.has(value))
          report(rule, `selector references unknown part ${value}`)
        if (attribute.attribute === 'data-dc-state' && !knownStates.has(value))
          report(rule, `selector references unknown state ${value}`)
      })
    }).processSync(rule.selector)
  })
}

function validateStructure(relativePath) {
  const root = readCss(relativePath)
  validatePublicProperties(root)
  const visualProperty = /^(?:animation(?:-.+)?|backdrop-filter|background(?:-.+)?|border-color|border-radius|box-shadow|color|font(?:-.+)?|letter-spacing|opacity|outline(?:-.+)?|text-shadow|transition(?:-.+)?)$/
  root.walkDecls((decl) => {
    if (visualProperty.test(decl.prop))
      report(decl, `structural CSS contains theme-owned property ${decl.prop}`)
  })
}

function validateDefaultTokens() {
  const root = readCss('src/baseline/tokens.css')
  const definitions = new Map()
  root.walkDecls(/^--dc-/, (decl) => {
    const values = definitions.get(decl.prop) ?? []
    values.push(decl.value)
    definitions.set(decl.prop, values)
  })

  for (const [name, token] of Object.entries(contract.tokens)) {
    const values = definitions.get(name) ?? []
    if (values.length !== 1)
      errors.push(`src/baseline/tokens.css: ${name} must have exactly one default, found ${values.length}`)
    else if (values[0] !== token.default)
      errors.push(`src/baseline/tokens.css: ${name} default differs from manifest (${values[0]} != ${token.default})`)
  }
  for (const name of definitions.keys()) {
    if (!knownTokens.has(name))
      errors.push(`src/baseline/tokens.css: default provided for unknown token ${name}`)
  }
}

function validateEntry(relativePath, expectedImports) {
  const root = readCss(relativePath)
  const imports = root.nodes
    .filter(node => node.type === 'atrule' && node.name === 'import')
    .map(node => node.params.replace(/^['"]|['"]$/g, ''))
  if (JSON.stringify(imports) !== JSON.stringify(expectedImports))
    errors.push(`${relativePath}: import order is ${JSON.stringify(imports)}, expected ${JSON.stringify(expectedImports)}`)
}

function validateRenderedHooks() {
  const roots = [
    'packages/designer/src/components',
    'packages/renderer/src/components',
    'packages/form-generator/src/components',
  ]
  const renderedComponents = new Set()
  const renderedParts = new Set()

  for (const root of roots) {
    for (const entry of fs.readdirSync(path.join(repoRoot, root))) {
      if (!entry.endsWith('.ts') || entry.endsWith('.test.ts'))
        continue
      const source = fs.readFileSync(path.join(repoRoot, root, entry), 'utf8')
      for (const match of source.matchAll(/['"]data-dc-component['"]\s*:\s*['"]([^'"]+)['"]/g))
        renderedComponents.add(match[1])
      for (const match of source.matchAll(/['"]data-dc-part['"]\s*:\s*['"]([^'"]+)['"]/g))
        renderedParts.add(match[1])
    }
  }

  for (const component of renderedComponents) {
    if (!knownComponents.has(component))
      errors.push(`render functions emit component missing from manifest: ${component}`)
  }
  for (const component of knownComponents) {
    if (!renderedComponents.has(component))
      errors.push(`manifest component is not emitted by a render function: ${component}`)
  }
  for (const part of renderedParts) {
    if (!knownParts.has(part))
      errors.push(`render functions emit part missing from manifest: ${part}`)
  }
  for (const part of knownParts) {
    if (!renderedParts.has(part))
      errors.push(`manifest part is not emitted by a render function: ${part}`)
  }
}

function validatePackageStyleExports() {
  for (const packageName of ['designer', 'renderer', 'form-generator']) {
    const packageRoot = path.join(repoRoot, 'packages', packageName)
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
    if (packageJson.exports?.['./structure.css'] !== './dist/structure.css')
      errors.push(`packages/${packageName}/package.json: missing ./structure.css export`)
    if (!packageJson.files?.includes('dist'))
      errors.push(`packages/${packageName}/package.json: dist must be published`)
    if (!Array.isArray(packageJson.sideEffects) || !packageJson.sideEffects.includes('**/*.css'))
      errors.push(`packages/${packageName}/package.json: CSS side effects are not declared`)
    if (!fs.existsSync(path.join(packageRoot, 'styles/structure.css')))
      errors.push(`packages/${packageName}: styles/structure.css does not exist`)
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
  for (const entry of ['./structure', './theme-contract.json', './css-custom-data.json']) {
    if (!packageJson.exports?.[entry])
      errors.push(`packages/themes/package.json: missing ${entry} export`)
  }
}

function validateGeneratedCustomData() {
  const expected = `${JSON.stringify(createCssCustomData(contract), null, 2)}\n`
  const actual = fs.existsSync(customDataPath) ? fs.readFileSync(customDataPath, 'utf8') : ''
  if (actual !== expected)
    errors.push('src/contract/css-custom-data.json is stale; run pnpm generate:contract')
}

validateDefaultTokens()
for (const entry of structureEntries)
  validateStructure(fileURLToPath(import.meta.resolve(entry)))
validateRecipe('src/baseline/recipes.css')
validateRecipe('src/material/recipes.css')
validatePublicProperties(readCss('src/material/tokens.css'))
validateEntry('src/standard/index.css', ['../structure.css', '../baseline/tokens.css', '../baseline/recipes.css'])
validateEntry('src/material/index.css', ['../structure.css', '../baseline/tokens.css', './tokens.css', '../baseline/recipes.css', './recipes.css'])
validateEntry('src/structure.css', structureEntries)
validateRenderedHooks()
validateGeneratedCustomData()
validatePackageStyleExports()

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write(`theme contract valid: ${knownTokens.size} tokens, ${knownComponents.size} components\n`)
}
