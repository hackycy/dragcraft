import type { ContainerRegionDefinition, DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/legacy-core'
import type { RendererContext } from './types'
import { createContainerPlan } from '@dragcraft/legacy-core'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createContainerRuntime } from './container-runtime'

function makeSplitNode(): SchemaNode {
  return {
    id: 'layout',
    type: 'split-layout',
    props: {},
    container: {
      variant: 'split',
      regions: {
        left: [{ id: 'left-child', type: 'text', props: {} }],
        right: [{ id: 'right-child', type: 'text', props: {} }],
      },
    },
  }
}

type TestRendererContext = RendererContext & { engine: DesignerEngine }

function makeContext(node: { value: SchemaNode }): TestRendererContext {
  const meta: WidgetMeta = {
    type: 'split-layout',
    title: 'Split layout',
    group: 'layout',
    defaultProps: {},
    formSchema: { sections: [] },
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
        stacked: {
          title: 'Stacked',
          regions: [{ id: 'main', title: 'Main' }],
        },
      },
    },
  }
  return {
    engine: {
      execute: vi.fn(() => ({ ok: true })),
      registry: { getWidget: vi.fn(() => meta) },
      store: { schema: ref({}) },
    } as unknown as DesignerEngine,
    schema: computed(() => ({
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [node.value] },
    })),
    session: {
      document: {
        getNode: (id: string) => id === node.value.id ? node.value : null,
        getRegionNodes: (containerId: string, regionId: string) =>
          containerId === node.value.id ? node.value.container?.regions[regionId] ?? [] : [],
      },
      materials: {
        resolveContainer: (container: SchemaNode) => createContainerPlan(
          container,
          { getWidget: () => meta } as unknown as DesignerEngine['registry'],
        ),
      },
      execute: vi.fn(() => ({ ok: true, changed: true })),
    } as unknown as RendererContext['session'],
  } as unknown as TestRendererContext
}

describe('container runtime', () => {
  it('exposes reactive container state and delegates variant changes', () => {
    const node = ref(makeSplitNode())
    const ctx = makeContext(node)
    const runtime = createContainerRuntime(() => node.value, ctx)

    expect(runtime.nodeId.value).toBe('layout')
    expect(runtime.variant.value).toBe('split')
    expect(runtime.regionDefinitions.value.map(region => region.id)).toEqual(['left', 'right'])
    expect(runtime.getRegionNodes('left').map(child => child.id)).toEqual(['left-child'])

    node.value = {
      ...node.value,
      container: {
        variant: 'stacked',
        regions: { main: [{ id: 'main-child', type: 'text', props: {} }] },
      },
    }
    expect(runtime.variant.value).toBe('stacked')
    expect(runtime.regionDefinitions.value.map(region => region.id)).toEqual(['main'])
    expect(runtime.getRegionNodes('main').map(child => child.id)).toEqual(['main-child'])

    expect(runtime.requestVariantChange('split')).toEqual({ ok: true, changed: true })
    expect(ctx.session.execute).toHaveBeenCalledWith({
      type: 'container.change-variant',
      containerId: 'layout',
      variant: 'split',
    })
  })

  it('returns detached region definition and node snapshots', () => {
    const node = ref(makeSplitNode())
    const ctx = makeContext(node)
    const runtime = createContainerRuntime(() => node.value, ctx)

    const definitions = runtime.regionDefinitions.value as ContainerRegionDefinition[]
    const readonlyChildren = runtime.getRegionNodes('left')
    const children = readonlyChildren as unknown as SchemaNode[]
    if (false) {
      // @ts-expect-error runtime snapshots are recursively readonly
      readonlyChildren[0].props.mutated = true
    }
    expect(() => {
      definitions[0].title = 'Mutated'
    }).toThrow(TypeError)
    expect(() => {
      children[0].props.mutated = true
    }).toThrow(TypeError)
    expect(() => {
      children.push({ id: 'injected', type: 'text', props: {} })
    }).toThrow(TypeError)

    expect(runtime.regionDefinitions.value[0].title).toBe('Left')
    expect(node.value.container!.regions.left).toEqual([
      { id: 'left-child', type: 'text', props: {} },
    ])
  })
})
