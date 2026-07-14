import type { ContainerDefinition, SchemaNode } from '@dragcraft/designer'
import { readFileSync } from 'node:fs'
import { CommandType, createEngine } from '@dragcraft/designer'
import { expect, it } from 'vitest'
import { resolveLinearDropIndex, splitContainerMeta } from './container'
import { playgroundWidgetDefinitions } from './index'

function itemRect(left: number, top: number, width = 20, height = 20): HTMLElement {
  return {
    getBoundingClientRect: () => ({ left, top, width, height }) as DOMRect,
  } as HTMLElement
}

function node(id: string): SchemaNode {
  return { id, type: 'text', props: {} }
}

function fullRegions(variant: ContainerDefinition['variants'][string]): Record<string, SchemaNode[]> {
  let nextId = 0
  const entries = variant.regions.map((region) => {
    const count = region.constraints?.maxItems ?? 0
    return [region.id, Array.from({ length: count }, () => node(`node-${nextId++}`))]
  })
  return Object.fromEntries(entries.reverse())
}

it('keeps all flex and irregular geometry outside framework metadata', () => {
  const metas = playgroundWidgetDefinitions.map(item => item.meta)
  const flex = metas.find(meta => meta.type === 'flex-container')!
  const split = metas.find(meta => meta.type === 'split-container')!
  expect(flex.container!.variants.single.regions.map(region => region.id)).toEqual(['default'])
  expect(split.container!.variants['left-one-right-two'].regions.map(region => region.id)).toEqual(['left', 'rightTop', 'rightBottom'])
  expect(JSON.stringify([flex.container, split.container])).not.toMatch(/flexDirection|display|gridTemplate|breakpoint/)
})

it('registers playground container definitions and split variants in declaration order', () => {
  expect(playgroundWidgetDefinitions.slice(-2).map(item => item.meta.type)).toEqual([
    'flex-container',
    'split-container',
  ])
  expect(Object.keys(splitContainerMeta.container!.variants)).toEqual([
    'left-one-right-two',
    'top-one-bottom-two',
  ])
})

it('styles the empty modifier emitted by ContainerRegionOutlet', () => {
  const canvasCss = readFileSync(
    new URL('../../../../packages/themes/src/components/canvas.css', import.meta.url),
    'utf8',
  )
  expect(canvasCss).toMatch(/\.dc-container-region--empty\s*\{/)
  expect(canvasCss).not.toContain('.dc-container-region__empty')
})

it('redistributes split children in stable order when the variant changes', () => {
  const result = splitContainerMeta.container!.migrateVariant!({
    schema: {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [] },
    },
    container: { id: 'split', type: 'split-container', props: {} },
    fromVariantId: 'left-one-right-two',
    toVariantId: 'top-one-bottom-two',
    fromVariant: splitContainerMeta.container!.variants['left-one-right-two'],
    toVariant: splitContainerMeta.container!.variants['top-one-bottom-two'],
    state: {
      variant: 'left-one-right-two',
      regions: {
        left: [node('first'), node('second')],
        rightTop: [node('third')],
        rightBottom: [node('fourth')],
      },
    },
  })

  expect(result).toEqual({
    allowed: true,
    state: {
      variant: 'top-one-bottom-two',
      regions: {
        top: [node('first')],
        bottomLeft: [node('second')],
        bottomRight: [node('third'), node('fourth')],
      },
    },
  })
})

it.each([
  ['left-one-right-two', 'top-one-bottom-two'],
  ['top-one-bottom-two', 'left-one-right-two'],
] as const)('migrates a max-capacity split from %s to %s without violating target constraints', (fromVariantId, toVariantId) => {
  const definition = splitContainerMeta.container
  const fromVariant = definition.variants[fromVariantId]
  const toVariant = definition.variants[toVariantId]
  const sourceRegions = fullRegions(fromVariant)
  const sourceIds = fromVariant.regions.flatMap(region => sourceRegions[region.id].map(item => item.id))
  const container: SchemaNode = {
    id: 'split',
    type: splitContainerMeta.type,
    props: {},
    container: { variant: fromVariantId, regions: sourceRegions },
  }
  const engine = createEngine({
    initialSchema: {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [container] },
    },
  })
  engine.registerWidget(splitContainerMeta)

  expect(engine.execute({
    type: CommandType.CHANGE_CONTAINER_VARIANT,
    payload: { containerId: container.id, variant: toVariantId },
  })).toMatchObject({ ok: true })

  const migrated = engine.state.getNodeById(container.id)!.container!
  for (const region of toVariant.regions) {
    const count = migrated.regions[region.id].length
    expect(count).toBeGreaterThanOrEqual(region.constraints?.minItems ?? 0)
    expect(count).toBeLessThanOrEqual(region.constraints?.maxItems ?? Number.POSITIVE_INFINITY)
  }
  const migratedIds = toVariant.regions.flatMap(region => migrated.regions[region.id].map(item => item.id))
  expect(migratedIds).toEqual(sourceIds)
  expect(new Set(migratedIds).size).toBe(sourceIds.length)
  engine.dispose()
})

it('returns a structured material denial when split target capacity is exhausted', () => {
  const definition = splitContainerMeta.container
  const fromVariant = definition.variants['left-one-right-two']
  const toVariant = definition.variants['top-one-bottom-two']
  const regions = fullRegions(fromVariant)
  regions.left.push(node('overflow'))

  expect(definition.migrateVariant!({
    schema: {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [] },
    },
    container: { id: 'split', type: 'split-container', props: {} },
    fromVariantId: 'left-one-right-two',
    toVariantId: 'top-one-bottom-two',
    fromVariant,
    toVariant,
    state: { variant: 'left-one-right-two', regions },
  })).toEqual({
    allowed: false,
    code: 'SPLIT_VARIANT_CAPACITY_EXCEEDED',
    details: { maxItems: 24, nodeCount: 25 },
  })
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
