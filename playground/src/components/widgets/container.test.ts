import { expect, it } from 'vitest'
import { playgroundNextMaterials } from '../../config/next-fixtures'
import { resolveLinearDropIndex } from './container'

function itemRect(left: number, top: number, width = 20, height = 20): HTMLElement {
  return {
    getBoundingClientRect: () => ({ left, top, width, height }) as DOMRect,
  } as HTMLElement
}

it('declares fixed Core Regions for the active Playground containers', () => {
  const flex = playgroundNextMaterials.find(material => material.type === 'flex-container')!
  const split = playgroundNextMaterials.find(material => material.type === 'split-container')!

  expect(flex.schema?.container?.regions.map(region => region.id)).toEqual(['default'])
  expect(split.schema?.container?.regions.map(region => region.id)).toEqual([
    'top',
    'bottomLeft',
    'bottomRight',
  ])
  expect(JSON.stringify([flex.schema?.container, split.schema?.container])).not.toMatch(/flexDirection|display|gridTemplate|breakpoint/)
})

it('keeps container presentation geometry in the component, not the Region declaration', () => {
  const split = playgroundNextMaterials.find(material => material.type === 'split-container')!
  const fields = split.inspector?.formSchema?.sections.flatMap(section => section.fields) ?? []

  expect(fields.map(field => field.key)).not.toContain('variant')
  expect(fields.map(field => field.key)).toEqual(expect.arrayContaining(['gap', 'primarySize']))
})

it('resolves insertion midpoints along the material-selected axis', () => {
  const base = {
    event: { clientX: 35, clientY: 5 } as DragEvent,
    regionElement: {} as HTMLElement,
    itemElements: [itemRect(0, 100), itemRect(40, 40)],
    nodes: [],
  }

  expect(resolveLinearDropIndex(base, 'x')).toBe(1)
  expect(resolveLinearDropIndex(base, 'y')).toBe(0)
  expect(resolveLinearDropIndex({
    ...base,
    event: { clientX: 80, clientY: 80 } as DragEvent,
  }, 'x')).toBe(2)
})
