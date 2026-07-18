import { readFileSync } from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import { expect, it } from 'vitest'

function declarations(css: string, selectors: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  postcss.parse(css).walkRules((rule) => {
    if (rule.selectors.length !== selectors.length
      || !rule.selectors.every((selector, index) => selector === selectors[index])) {
      return
    }
    rule.walkDecls((declaration) => {
      result[declaration.prop] = declaration.value
    })
  })
  return result
}

it('paints root selection edges around the full-width root segment', () => {
  const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
  const blockEdges = declarations(css, ['.dc-node__selection-edge--block-start', '.dc-node__selection-edge--block-end'])
  const blockStart = declarations(css, ['.dc-node__selection-edge--block-start'])
  const blockEnd = declarations(css, ['.dc-node__selection-edge--block-end'])
  const inlineEdges = declarations(css, ['.dc-node__selection-edge--inline-start', '.dc-node__selection-edge--inline-end'])
  const inlineStart = declarations(css, ['.dc-node__selection-edge--inline-start'])
  const inlineEnd = declarations(css, ['.dc-node__selection-edge--inline-end'])

  expect(blockEdges).toMatchObject({ right: '0', left: '0' })
  expect(blockStart).toMatchObject({ bottom: '100%' })
  expect(blockEnd).toMatchObject({ top: '100%' })
  expect(inlineEdges.top).toContain('calc(-1 * var(--dc-node-selection-root-block-overlap')
  expect(inlineEdges.bottom).toContain('calc(-1 * var(--dc-node-selection-root-block-overlap')
  expect(inlineStart).toMatchObject({ left: '0' })
  expect(inlineEnd).toMatchObject({ right: '0' })
})
