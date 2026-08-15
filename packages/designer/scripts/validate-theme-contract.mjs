import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'
import { createCssCustomData } from './generate-theme-custom-data.mjs'

const packageRoot = path.resolve(import.meta.dirname, '..')
const repoRoot = path.resolve(packageRoot, '../..')
const contractPath = path.join(packageRoot, 'theme/contract/theme-contract.json')
const customDataPath = path.join(packageRoot, 'theme/contract/css-custom-data.json')
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const errors = []
const structureEntries = [
  '@dragcraft/ui/structure.css',
  '../styles/structure.css',
  '../src/presentation/structure.css',
  '@dragcraft/form-generator/structure.css',
]

const knownTokens = new Set(Object.keys(contract.tokens))
const integrationProperties = new Set(Object.keys(contract.integrationProperties))
const knownProperties = new Set([...knownTokens, ...integrationProperties])
const knownComponents = new Set(Object.keys(contract.components))
const knownParts = new Set(Object.values(contract.components).flatMap(component => component.parts))
const knownStates = new Set(Object.values(contract.components).flatMap(component => component.states))
const internalPropertyPrefix = '--dc-internal-'
const legacyInternalPropertyPattern = /--_dc-[a-z0-9-]+/g
const dragcraftPropertyPattern = /--dc-[a-z0-9-]+/g

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
    if (decl.prop.startsWith('--_dc-'))
      report(decl, `declares legacy internal property ${decl.prop}; use ${internalPropertyPrefix}<owner>-<name>`)

    if (decl.prop.startsWith('--dc-') && !decl.prop.startsWith(internalPropertyPrefix) && !knownProperties.has(decl.prop))
      report(decl, `declares unknown public property ${decl.prop}`)

    const legacyReferences = decl.value.match(legacyInternalPropertyPattern) ?? []
    for (const property of legacyReferences)
      report(decl, `uses legacy internal property ${property}; use ${internalPropertyPrefix}<owner>-<name>`)

    const referenced = decl.value.match(dragcraftPropertyPattern) ?? []
    for (const property of referenced) {
      if (!property.startsWith(internalPropertyPrefix) && !knownProperties.has(property))
        report(decl, `uses unknown public property ${property}`)
    }
  })
}

function validateRecipe(relativePath) {
  const root = readCss(relativePath)
  validatePublicProperties(root)
  const inheritableProperties = /^(?:color|font(?:-.+)?|letter-spacing|line-height|text-align)$/
  const contentBoundaryComponents = /data-dc-component=["'](?:designer|application-surface|presentation-frame-boundary|container-shell|canvas-surface|canvas|node)["']/

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
  const root = readCss('theme/baseline/tokens.css')
  const definitions = new Map()
  root.walkDecls(/^--dc-/, (decl) => {
    const values = definitions.get(decl.prop) ?? []
    values.push(decl.value)
    definitions.set(decl.prop, values)
  })

  for (const [name, token] of Object.entries(contract.tokens)) {
    const values = definitions.get(name) ?? []
    if (values.length !== 1)
      errors.push(`theme/baseline/tokens.css: ${name} must have exactly one default, found ${values.length}`)
    else if (values[0] !== token.default)
      errors.push(`theme/baseline/tokens.css: ${name} default differs from manifest (${values[0]} != ${token.default})`)
  }
  for (const name of definitions.keys()) {
    if (!knownTokens.has(name))
      errors.push(`theme/baseline/tokens.css: default provided for unknown token ${name}`)
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
    'packages/ui/src/components',
    'packages/designer/src/components',
    'packages/designer/src/presentation',
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
  for (const packageName of ['ui', 'form-generator']) {
    const currentPackageRoot = path.join(repoRoot, 'packages', packageName)
    const packageJson = JSON.parse(fs.readFileSync(path.join(currentPackageRoot, 'package.json'), 'utf8'))
    if (packageJson.exports?.['./structure.css'] !== './dist/structure.css')
      errors.push(`packages/${packageName}/package.json: missing ./structure.css export`)
    if (!packageJson.files?.includes('dist'))
      errors.push(`packages/${packageName}/package.json: dist must be published`)
    if (!Array.isArray(packageJson.sideEffects) || !packageJson.sideEffects.includes('**/*.css'))
      errors.push(`packages/${packageName}/package.json: CSS side effects are not declared`)
    if (!fs.existsSync(path.join(currentPackageRoot, 'styles/structure.css')))
      errors.push(`packages/${packageName}: styles/structure.css does not exist`)
    if (packageName === 'ui') {
      if (packageJson.exports?.['./recipe.css'] !== './dist/recipe.css')
        errors.push('packages/ui/package.json: missing ./recipe.css export')
      if (packageJson.exports?.['./styles'] !== './dist/styles.css')
        errors.push('packages/ui/package.json: missing ./styles export')
    }
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
  for (const entry of ['./standard.css', './structure.css', './theme-contract.json', './css-custom-data.json']) {
    if (!packageJson.exports?.[entry])
      errors.push(`packages/designer/package.json: missing ${entry} export`)
  }
  if (!fs.existsSync(path.join(packageRoot, 'styles/structure.css')))
    errors.push('packages/designer: styles/structure.css does not exist')
}

function validateDesignerStructureOwnership() {
  const source = fs.readFileSync(path.join(packageRoot, 'theme/structure.css'), 'utf8')
  const retiredStructureCssImport = ['@dragcraft', 'renderer', 'structure.css'].join('/')
  if (source.includes(retiredStructureCssImport))
    errors.push('packages/designer/theme/structure.css must own structure CSS without Renderer imports')
}

function validateGeneratedCustomData() {
  const expected = `${JSON.stringify(createCssCustomData(contract), null, 2)}\n`
  const actual = fs.existsSync(customDataPath) ? fs.readFileSync(customDataPath, 'utf8') : ''
  if (actual !== expected)
    errors.push('theme/contract/css-custom-data.json is stale; run pnpm generate:theme-contract')
}

validateDefaultTokens()
for (const entry of structureEntries.filter(entry => entry.startsWith('@dragcraft/')))
  validateStructure(fileURLToPath(import.meta.resolve(entry)))
validateStructure('styles/structure.css')
validateRecipe('theme/baseline/recipes.css')
validateRecipe(fileURLToPath(import.meta.resolve('@dragcraft/ui/recipe.css')))
validateEntry('theme/standard.css', ['./structure.css', './baseline/tokens.css', './baseline/recipes.css'])
validateEntry('theme/structure.css', structureEntries)
validateRenderedHooks()
validateGeneratedCustomData()
validatePackageStyleExports()
validateDesignerStructureOwnership()

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write(`theme contract valid: ${knownTokens.size} tokens, ${knownComponents.size} components\n`)
}
