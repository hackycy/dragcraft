import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { it } from 'vitest'

const workspaceRoot = new URL('../', import.meta.url)

function readWorkspaceFile(path) {
  return readFileSync(new URL(path, workspaceRoot), 'utf8')
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
