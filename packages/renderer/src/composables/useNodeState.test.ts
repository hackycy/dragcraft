import type { DesignerEngine } from '@dragcraft/core'
import type { RendererContext } from '../types'
import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useNodeState } from './useNodeState'

function makeContext(overrides?: Partial<RendererContext>): RendererContext {
  const selectedNodeId = ref<string | null>(null)
  const hoveredNodeId = ref<string | null>(null)
  return {
    engine: {
      store: {
        selectedNodeId,
        hoveredNodeId,
        selectNode: (id: string | null) => {
          selectedNodeId.value = id
        },
        hoverNode: (id: string | null) => {
          hoveredNodeId.value = id
        },
      },
    } as unknown as DesignerEngine,
    componentMap: {},
    extensions: {},
    eventHooks: {},
    actionInterceptors: [],
    actionRegistry: {} as RendererContext['actionRegistry'],
    dragOverNodeId: ref(null),
    ...overrides,
  } as RendererContext
}

describe('useNodeState', () => {
  let ctx: RendererContext

  beforeEach(() => {
    ctx = makeContext()
  })

  it('isSelected is true when selectedNodeId matches', () => {
    const state = useNodeState(() => 'node-1', ctx)
    expect(state.isSelected.value).toBe(false)

    ctx.engine.store.selectNode('node-1')
    expect(state.isSelected.value).toBe(true)
  })

  it('isSelected is false for different node id', () => {
    const state = useNodeState(() => 'node-1', ctx)
    ctx.engine.store.selectNode('node-2')
    expect(state.isSelected.value).toBe(false)
  })

  it('isHovered is true when hoveredNodeId matches', () => {
    const state = useNodeState(() => 'node-1', ctx)
    expect(state.isHovered.value).toBe(false)

    ctx.engine.store.hoverNode('node-1')
    expect(state.isHovered.value).toBe(true)
  })

  it('isDragOver is true when dragOverNodeId matches', () => {
    const state = useNodeState(() => 'node-1', ctx)
    expect(state.isDragOver.value).toBe(false)

    ctx.dragOverNodeId.value = 'node-1'
    expect(state.isDragOver.value).toBe(true)
  })

  it('interactionClasses reflects all states', () => {
    const state = useNodeState(() => 'node-1', ctx)

    expect(state.interactionClasses.value).toEqual({
      'dc-node--selected': false,
      'dc-node--hovered': false,
      'dc-node--drag-over': false,
    })

    ctx.engine.store.selectNode('node-1')
    ctx.engine.store.hoverNode('node-1')
    ctx.dragOverNodeId.value = 'node-1'

    expect(state.interactionClasses.value).toEqual({
      'dc-node--selected': true,
      'dc-node--hovered': true,
      'dc-node--drag-over': true,
    })
  })

  it('reacts to dynamic node id changes', () => {
    const nodeId = ref('node-1')
    const state = useNodeState(() => nodeId.value, ctx)

    ctx.engine.store.selectNode('node-1')
    expect(state.isSelected.value).toBe(true)

    nodeId.value = 'node-2'
    expect(state.isSelected.value).toBe(false)
  })
})
