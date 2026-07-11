import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { it } from 'vitest'

const workspaceRoot = new URL('../', import.meta.url)

function readWorkspaceFile(path) {
  return readFileSync(new URL(path, workspaceRoot), 'utf8')
}

function readRule(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

it('themes and playground defaults do not inject external widget spacing', () => {
  const canvasCss = readWorkspaceFile('packages/themes/src/components/canvas.css')
  const widgetRule = canvasCss.match(/\.dc-node--widget\s*\{([^}]*)\}/)?.[1] ?? ''

  assert.doesNotMatch(widgetRule, /\b(?:margin|padding)(?:-[\w-]+)?\s*:/)

  const templatesDirectory = new URL('playground/src/config/templates/', workspaceRoot)
  const templateFiles = readdirSync(templatesDirectory)
    .filter(file => file.endsWith('-schema.ts'))

  for (const file of templateFiles) {
    const source = readFileSync(new URL(file, templatesDirectory), 'utf8')
    assert.doesNotMatch(source, /\b(?:margin|padding)(?:[A-Z][A-Za-z]*)?\s*:/, file)
  }

  const basicWidgets = readWorkspaceFile('playground/src/components/widgets/basic.ts')
  assert.doesNotMatch(basicWidgets, /container:\s*\{[^}]*\b(?:margin|padding)(?:[A-Z][A-Za-z]*)?\s*:/)
})

it('output themes and playground widgets do not inject decorative rounding or shadows', () => {
  const canvasCss = readWorkspaceFile('packages/themes/src/components/canvas.css')
  assert.doesNotMatch(readRule(canvasCss, '.dc-root-renderer'), /\b(?:border-radius|box-shadow)\s*:/)
  assert.doesNotMatch(readRule(canvasCss, '.dc-node'), /\bborder-radius\s*:/)

  const themeWidgets = readWorkspaceFile('packages/themes/src/components/widgets.css')
  assert.doesNotMatch(themeWidgets, /\b(?:border-radius|box-shadow)\s*:/)

  const playgroundCss = readWorkspaceFile('playground/src/styles/playground.css')
  const enhancementSection = playgroundCss.match(/Widget Visual Enhancement[\s\S]*?JSON Modal/)?.[0] ?? ''
  assert.doesNotMatch(enhancementSection, /\b(?:border-radius|box-shadow)\s*:/)

  const playgroundWidgets = readWorkspaceFile('playground/src/components/widgets/styles.css')
  const decorationFreeSelectors = [
    '.pg-widget-button',
    '.pg-widget-button:hover:not(:disabled)',
    '.pg-widget-image--empty',
    '.pg-widget-form__control',
    '.pg-widget-form__control:focus',
    '.pg-widget-choice__mark',
    '.pg-widget-tabbar',
    '.pg-widget-tabbar__text-icon',
  ]

  for (const selector of decorationFreeSelectors)
    assert.doesNotMatch(readRule(playgroundWidgets, selector), /\b(?:border-radius|box-shadow)\s*:/, selector)

  assert.doesNotMatch(readRule(playgroundWidgets, '.pg-widget-floating-button'), /\bbox-shadow\s*:/)

  const miniProgramWidgets = readWorkspaceFile('playground/src/components/widgets/mini-program.ts')
  const ecommerceTemplate = readWorkspaceFile('playground/src/config/templates/ecommerce-schema.ts')
  assert.doesNotMatch(miniProgramWidgets, /borderRadius:\s*0/)
  assert.doesNotMatch(ecommerceTemplate, /borderRadius\s*:/)
})
