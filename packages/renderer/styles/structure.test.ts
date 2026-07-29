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

it('lets the Renderer-owned root plane include the active frame outline', () => {
  const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
  const rootPlane = declarations(css, ['.dc-node-selection-plane--root'])

  expect(rootPlane).toMatchObject({
    'inset': 'calc(-1 * var(--_dc-root-selection-plane-outset, 0px))',
    'clip-path': 'inset(0 round var(--_dc-root-selection-plane-radius, 0px))',
  })
})

it('keeps Canvas Surface layout state out of the slot-only Container Shell', () => {
  const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
  const canvasSurface = declarations(css, ['.dc-canvas-surface'])
  const defaultShell = declarations(css, ['.dc-container-shell'])
  const sharedMarker = declarations(css, ['[data-dc-component="container-shell"]'])

  expect(canvasSurface.display).toBe('grid')
  expect(canvasSurface['--dc-inset-inline-start']).toContain('--dc-sized-inset-inline-start')
  expect(defaultShell.display).toBeUndefined()
  expect(defaultShell['grid-template-columns']).toBeUndefined()
  expect(defaultShell['--dc-inset-inline-start']).toBeUndefined()
  expect(sharedMarker.display).toBeUndefined()
  expect(sharedMarker['grid-template-columns']).toBeUndefined()
  expect(sharedMarker['--dc-inset-inline-start']).toBeUndefined()
})
