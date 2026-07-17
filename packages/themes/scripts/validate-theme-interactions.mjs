import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const packageRoot = path.resolve(import.meta.dirname, '..')
const recipes = parse('src/baseline/recipes.css')
const designerStructure = parse(import.meta.resolve('@dragcraft/designer/structure.css'))
const formStructure = parse(import.meta.resolve('@dragcraft/form-generator/structure.css'))
const rendererStructure = parse(import.meta.resolve('@dragcraft/renderer/structure.css'))
const errors = []

function parse(relativePath) {
  const absolutePath = relativePath.startsWith('file:')
    ? fileURLToPath(relativePath)
    : path.resolve(packageRoot, relativePath)
  return postcss.parse(fs.readFileSync(absolutePath, 'utf8'), { from: absolutePath })
}

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, ' ').trim()
}

function findRule(root, selector) {
  let match
  root.walkRules((rule) => {
    if (!match && normalizeSelector(rule.selector) === normalizeSelector(selector))
      match = rule
  })
  return match
}

function declaration(rule, property) {
  return rule?.nodes.find(node => node.type === 'decl' && node.prop === property)?.value
}

function expectDeclarations(label, root, selector, expected) {
  const rule = findRule(root, selector)
  if (!rule) {
    errors.push(`${label}: missing rule ${normalizeSelector(selector)}`)
    return
  }

  for (const [property, value] of Object.entries(expected)) {
    const actual = declaration(rule, property)
    if (actual !== value)
      errors.push(`${label}: expected ${property}: ${value}, found ${actual ?? 'nothing'}`)
  }
}

function expectNoDeclarations(label, root, selector, properties) {
  const rule = findRule(root, selector)
  for (const property of properties) {
    const actual = declaration(rule, property)
    if (actual !== undefined)
      errors.push(`${label}: expected no ${property}, found ${actual}`)
  }
}

expectDeclarations('drop indicator', recipes, '[data-dc-component="drop-indicator"]', {
  background: 'var(--dc-color-accent-subtle)',
  border: '2px dashed var(--dc-color-accent)',
})

expectDeclarations('node drag over', recipes, '[data-dc-component="node"][data-dc-state~="drag-over"]', {
  'background-color': 'var(--dc-color-accent-subtle)',
  'outline': '1px dashed var(--dc-color-accent)',
  'outline-offset': '-1px',
})
expectNoDeclarations('node drag over', recipes, '[data-dc-component="node"][data-dc-state~="drag-over"]', [
  'border-color',
  'border-style',
])
expectNoDeclarations('node wrapper geometry', rendererStructure, '.dc-node', ['border'])

expectDeclarations('container material selection', recipes, '[data-dc-component="node-selection"]', {
  border: 'var(--dc-node-selection-stroke-width) solid var(--dc-color-accent)',
})

expectDeclarations('node toolbar', recipes, '[data-dc-component="node-toolbar"]', {
  color: 'var(--dc-color-on-accent)',
  background: 'var(--dc-color-accent)',
})

expectDeclarations('node toolbar actions', recipes, '[data-dc-component="node-toolbar"] > [data-dc-part="action"]', {
  color: 'var(--dc-color-on-accent)',
  background: 'var(--dc-color-accent)',
})

function sharedHeaderSelector(suffix = '') {
  return [
    `[data-dc-component="material-group"] > [data-dc-part="header"]${suffix}`,
    `[data-dc-component="form-section"] > [data-dc-part="header"]${suffix}`,
  ].join(',\n')
}

expectDeclarations('shared collapsible header', recipes, sharedHeaderSelector(), {
  'color': 'var(--dc-color-text-muted)',
  'background': 'transparent',
  'border-radius': 'var(--dc-radius-md)',
})
expectDeclarations('shared collapsible header hover', recipes, sharedHeaderSelector(':hover'), {
  color: 'var(--dc-color-text)',
  background: 'var(--dc-color-surface-subtle)',
})
expectDeclarations('shared collapsible header focus', recipes, sharedHeaderSelector(':focus-visible'), {
  'outline': '2px solid var(--dc-color-focus-ring)',
  'outline-offset': '-1px',
})
expectDeclarations('shared collapsible header title', recipes, sharedHeaderSelector(' > [data-dc-part="title"]'), {
  'color': 'var(--dc-color-text-muted)',
  'font-size': 'var(--dc-font-size-sm)',
  'font-weight': 'var(--dc-font-weight-semibold)',
})
expectDeclarations('shared collapsible header toggle', recipes, sharedHeaderSelector(' > [data-dc-part="toggle"]'), {
  transition: 'transform var(--dc-duration-normal) var(--dc-ease-standard)',
})

const materialHeader = findRule(designerStructure, '.dc-material-group__header')
const formHeader = findRule(formStructure, '.dc-form-section__header')
for (const property of ['min-height', 'padding']) {
  const expected = declaration(materialHeader, property)
  const actual = declaration(formHeader, property)
  if (actual !== expected)
    errors.push(`form section header: expected ${property}: ${expected}, found ${actual ?? 'nothing'}`)
}

const materialCollapsedToggle = findRule(designerStructure, '.dc-material-group__toggle--collapsed')
const formCollapsedToggle = findRule(formStructure, '.dc-form-section__toggle--collapsed')
if (declaration(formCollapsedToggle, 'transform') !== declaration(materialCollapsedToggle, 'transform'))
  errors.push('form section header: collapsed toggle transform must match material group')

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
}
else {
  process.stdout.write('theme interaction recipes valid\n')
}
