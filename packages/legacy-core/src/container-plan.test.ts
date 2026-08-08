import type { RegistryInstance, SchemaNode, WidgetMeta } from './types'
import { describe, expect, it } from 'vitest'
import { createContainerPlan } from './container-plan'
import { createRegistry } from './registry'

function makeNode(id: string, type = 'text'): SchemaNode {
  return { id, type, props: {} }
}

function makeContainer(
  id: string,
  regions: Record<string, SchemaNode[]>,
  variant = 'split',
  type = 'split-layout',
): SchemaNode {
  return {
    ...makeNode(id, type),
    container: { variant, regions },
  }
}

function makeMeta(type: string, overrides: Partial<WidgetMeta> = {}): WidgetMeta {
  return {
    type,
    title: type,
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  }
}

function makeSplitRegistry(): RegistryInstance {
  const registry = createRegistry()
  registry.registerWidget(makeMeta('split-layout', {
    container: {
      defaultVariant: 'split',
      variants: {
        split: {
          title: 'Split',
          regions: [
            { id: 'left', title: 'Left' },
            { id: 'right', title: 'Right' },
          ],
        },
      },
    },
  }))
  return registry
}

describe('createContainerPlan', () => {
  it('projects schema regions in registration order without geometry', () => {
    const node = makeContainer('layout', {
      right: [makeNode('b')],
      left: [makeNode('a')],
      stale: [makeNode('ignored')],
    })

    const result = createContainerPlan(node, makeSplitRegistry())

    expect(result.ok).toBe(true)
    if (!result.ok)
      throw new Error(result.code)
    expect(result.plan.containerId).toBe('layout')
    expect(result.plan.regions).toEqual([
      {
        definition: { id: 'left', title: 'Left' },
        nodes: [expect.objectContaining({ id: 'a' })],
        isEmpty: false,
      },
      {
        definition: { id: 'right', title: 'Right' },
        nodes: [expect.objectContaining({ id: 'b' })],
        isEmpty: false,
      },
    ])
  })

  it('projects a registered missing region as empty without mutating state', () => {
    const node = makeContainer('layout', { left: [] })

    const result = createContainerPlan(node, makeSplitRegistry())

    expect(result.ok).toBe(true)
    if (!result.ok)
      throw new Error(result.code)
    expect(result.plan.regions.map(region => [region.definition.id, region.isEmpty])).toEqual([
      ['left', true],
      ['right', true],
    ])
    expect(node.container!.regions).toEqual({ left: [] })
  })

  it.each([
    ['missing state', makeNode('layout', 'split-layout'), makeSplitRegistry()],
    ['missing definition', makeContainer('layout', { left: [] }), createRegistry()],
  ])('reports an unresolved container for %s', (_label, node, registry) => {
    expect(createContainerPlan(node, registry)).toEqual({
      ok: false,
      code: 'CONTAINER_UNRESOLVED',
      containerId: 'layout',
    })
  })

  it('reports an unknown persisted variant', () => {
    const result = createContainerPlan(
      makeContainer('layout', { left: [] }, 'missing'),
      makeSplitRegistry(),
    )

    expect(result).toEqual({
      ok: false,
      code: 'CONTAINER_VARIANT_UNKNOWN',
      containerId: 'layout',
    })
  })
})
