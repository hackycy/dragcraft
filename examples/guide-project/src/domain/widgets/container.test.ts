import type { RegionDropGeometryContext } from '@dragcraft/designer'
import { expect, it } from 'vitest'
import { resolveVerticalDropAnchor } from './container'

function element(top: number): HTMLElement {
  return {
    getBoundingClientRect: () => ({ top, height: 20 }) as DOMRect,
  } as HTMLElement
}

it('resolves vertical browser geometry to structural anchors', () => {
  const context = {
    event: { clientY: 35 } as DragEvent,
    itemElements: [element(0), element(40)],
    nodeIds: ['first', 'second'],
    regionElement: {} as HTMLElement,
  } satisfies RegionDropGeometryContext

  expect(resolveVerticalDropAnchor(context)).toEqual({ kind: 'before', nodeId: 'second' })
  expect(resolveVerticalDropAnchor({
    ...context,
    event: { clientY: 80 } as DragEvent,
  })).toEqual({ kind: 'after', nodeId: 'second' })
})
