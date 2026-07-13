import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { RendererContext } from './types'
import { CommandType } from '@dragcraft/core'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
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

function makeContext(): RendererContext {
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
    } as unknown as DesignerEngine,
  } as unknown as RendererContext
}

describe('container runtime', () => {
  it('exposes reactive container state and delegates variant changes', () => {
    const node = ref(makeSplitNode())
    const ctx = makeContext()
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

    expect(runtime.requestVariantChange('split')).toEqual({ ok: true })
    expect(ctx.engine.execute).toHaveBeenCalledWith({
      type: CommandType.CHANGE_CONTAINER_VARIANT,
      payload: { containerId: 'layout', variant: 'split' },
    })
  })
})
