import { expect, it } from 'vitest'
import { guideMaterials } from '../materials'
import { resolveVerticalDropIndex } from './container'

function itemRect(top: number, height = 20): HTMLElement {
  return {
    getBoundingClientRect: () => ({ top, height }) as DOMRect,
  } as HTMLElement
}

it('declares the Guide column container through the active MaterialDefinition', () => {
  const container = guideMaterials.find(material => material.type === 'column-container')!

  expect(container.schema?.container?.regions).toEqual([
    { id: 'content', cardinality: { max: 4 } },
  ])
  expect(container.inspector?.formSchema?.sections[0].fields.map(field => field.key)).toEqual(['gap'])
})

it('resolves vertical Region insertion from item midpoints', () => {
  const base = {
    event: { clientY: 25 } as DragEvent,
    regionElement: {} as HTMLElement,
    itemElements: [itemRect(0), itemRect(40)],
    nodes: [],
  }

  expect(resolveVerticalDropIndex(base)).toBe(1)
  expect(resolveVerticalDropIndex({ ...base, event: { clientY: 80 } as DragEvent })).toBe(2)
})
