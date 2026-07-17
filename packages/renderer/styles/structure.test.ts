import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, it } from 'vitest'

function rule(css: string, selector: string): string | undefined {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].trim() === selector)
      return match[0]
  }
}

it('paints root selection edges around the full-width root segment', () => {
  const css = readFileSync(path.resolve(process.cwd(), 'styles/structure.css'), 'utf8')
  const blockEdges = rule(css, '.dc-node__selection-edge--block-start,\n.dc-node__selection-edge--block-end')
  const blockStart = rule(css, '.dc-node__selection-edge--block-start')
  const blockEnd = rule(css, '.dc-node__selection-edge--block-end')
  const inlineEdges = rule(css, '.dc-node__selection-edge--inline-start,\n.dc-node__selection-edge--inline-end')
  const inlineStart = rule(css, '.dc-node__selection-edge--inline-start')
  const inlineEnd = rule(css, '.dc-node__selection-edge--inline-end')

  expect(blockEdges).toContain('right: 0;')
  expect(blockEdges).toContain('left: 0;')
  expect(blockStart).toContain('bottom: 100%;')
  expect(blockEnd).toContain('top: 100%;')
  expect(inlineEdges).toContain('top: calc(-1 * var(--dc-node-selection-root-block-overlap')
  expect(inlineEdges).toContain('bottom: calc(-1 * var(--dc-node-selection-root-block-overlap')
  expect(inlineStart).toContain('left: 0;')
  expect(inlineEnd).toContain('right: 0;')
})
