import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { RendererContext } from '../types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useWidgetNode } from './useWidgetNode'

function makeNode(id: string, type = 'text'): SchemaNode {
  return { id, type, props: {} }
}

function makeMeta(type: string, overrides?: Partial<WidgetMeta>): WidgetMeta {
  return {
    type,
    title: type,
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  } as WidgetMeta
}

function makeContext(overrides?: Partial<RendererContext>): RendererContext {
  const schema = { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children: [] } }
  return {
    engine: {
      store: {
        schema: ref(schema),
        selectedNodeId: ref(null),
        hoveredNodeId: ref(null),
        dragTarget: ref(null),
        getRawSchema: () => schema,
        selectNode: vi.fn(),
        hoverNode: vi.fn(),
      },
      state: {
        getSchema: () => schema,
        getNodeById: (id: string) => schema.root.children?.find(node => node.id === id) ?? null,
        getSelectedNodeId: () => null,
        getHoveredNodeId: () => null,
        getDragTarget: () => null,
      },
      registry: {
        getWidget: vi.fn(() => undefined),
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

describe('useWidgetNode', () => {
  let ctx: RendererContext

  beforeEach(() => {
    ctx = makeContext()
  })

  it('resolves component from componentMap', () => {
    const comp = { name: 'TextWidget' } as any
    ctx.componentMap = { text: comp }
    const node = useWidgetNode(() => makeNode('a', 'text'), ctx)
    expect(node.resolvedComponent.value).toBe(comp)
  })

  it('resolves to undefined for unregistered type', () => {
    ctx.componentMap = {}
    const node = useWidgetNode(() => makeNode('a', 'unknown'), ctx)
    expect(node.resolvedComponent.value).toBeUndefined()
  })

  it('resolves meta from registry', () => {
    const meta = makeMeta('text')
    vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(meta)
    const node = useWidgetNode(() => makeNode('a', 'text'), ctx)
    expect(node.meta.value).toBe(meta)
  })

  describe('behavior predicates', () => {
    it('useMask defaults to true when meta.mask is undefined', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.useMask.value).toBe(true)
    })

    it('useMask is false when meta.mask is false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { mask: false }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.useMask.value).toBe(false)
    })

    it('useMask evaluates predicate function', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(
        makeMeta('text', { mask: (ctx: any) => ctx.node.id === 'a' }),
      )
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.useMask.value).toBe(true)
    })

    it('selectable defaults to true', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.selectable.value).toBe(true)
    })

    it('selectable is false when meta.selectable is false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { selectable: false }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.selectable.value).toBe(false)
    })

    it('sortable defaults to true', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.sortable.value).toBe(true)
    })

    it('sortable false implies draggable false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { sortable: false }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.sortable.value).toBe(false)
      expect(node.draggable.value).toBe(false)
    })

    it('draggable defaults to true when sortable is true', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.draggable.value).toBe(true)
    })

    it('draggable false does not affect sortable', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { draggable: false }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.sortable.value).toBe(true)
      expect(node.draggable.value).toBe(false)
    })

    it('nodes outside sort scopes are not draggable', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('tabbar', {
        defaultLayout: { placement: { kind: 'chrome', edge: 'block-end' } },
      }))
      const node = useWidgetNode(() => makeNode('a', 'tabbar'), ctx)
      expect(node.inSortScope.value).toBe(false)
      expect(node.draggable.value).toBe(false)
    })

    it('content nodes remain draggable by default', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.inSortScope.value).toBe(true)
      expect(node.draggable.value).toBe(true)
    })
  })

  describe('wrapperClasses', () => {
    it('includes base classes', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const classes = node.wrapperClasses.value
      expect(classes).toContain('dc-node')
      expect(classes).toContain('dc-node--widget')
    })

    it('includes masked class when useMask is true', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { mask: true }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--masked']).toBe(true)
      expect(classObj['dc-node--unmasked']).toBe(false)
    })

    it('includes locked class when sortable is false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { sortable: false }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--locked']).toBe(true)
    })

    it('includes unsorted class when node is outside sort scopes', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('tabbar', {
        defaultLayout: { placement: { kind: 'chrome', edge: 'block-end' } },
      }))
      const node = useWidgetNode(() => makeNode('a', 'tabbar'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--unsorted']).toBe(true)
    })

    it('does not include unsorted class for content nodes', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--unsorted']).toBe(false)
    })

    it('does not include locked class when node is outside sort scopes', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('tabbar', {
        defaultLayout: { placement: { kind: 'chrome', edge: 'block-end' } },
      }))
      const node = useWidgetNode(() => makeNode('a', 'tabbar'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--locked']).toBe(false)
    })

    it('includes dragging class for the active drag source', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      ctx.engine.store.dragTarget.value = { sourceNodeId: 'a', widgetType: null }
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(node.isDragging.value).toBe(true)
      expect(classObj['dc-node--dragging']).toBe(true)
    })
  })

  describe('visible', () => {
    it('defaults to true when no visibility layout', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.visible.value).toBe(true)
    })

    it('is false when node layout has visible: false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const schemaNode = { ...makeNode('a'), layout: { visible: false } }
      const node = useWidgetNode(() => schemaNode, ctx)
      expect(node.visible.value).toBe(false)
    })

    it('is true when node layout has visible: true', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const schemaNode = { ...makeNode('a'), layout: { visible: true } }
      const node = useWidgetNode(() => schemaNode, ctx)
      expect(node.visible.value).toBe(true)
    })

    it('evaluates visible predicate function with schema', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const predicate = vi.fn(({ schema }: any) => schema.root.id === 'root')
      const schemaNode = { ...makeNode('a'), layout: { visible: predicate } }
      const node = useWidgetNode(() => schemaNode, ctx)
      expect(node.visible.value).toBe(true)
      expect(predicate).toHaveBeenCalled()
    })

    it('applies dc-node--hidden class when not visible', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const schemaNode = { ...makeNode('a'), layout: { visible: false } }
      const node = useWidgetNode(() => schemaNode, ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--hidden']).toBe(true)
    })

    it('does not apply dc-node--hidden class when visible', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--hidden']).toBe(false)
    })
  })

  describe('handleSelect', () => {
    it('selects node when no before hook', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      ctx.eventHooks = {}
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const e = { stopPropagation: vi.fn() } as unknown as MouseEvent
      node.handleSelect(e)
      expect(ctx.engine.store.selectNode).toHaveBeenCalledWith('a')
      expect(e.stopPropagation).toHaveBeenCalled()
    })

    it('does not select when selectable is false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { selectable: false }))
      ctx.eventHooks = {}
      const node = useWidgetNode(() => makeNode('a'), ctx)
      node.handleSelect({ stopPropagation: vi.fn() } as unknown as MouseEvent)
      expect(ctx.engine.store.selectNode).not.toHaveBeenCalled()
    })

    it('cancels selection when before hook returns false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      ctx.eventHooks = { onBeforeSelect: () => false }
      const node = useWidgetNode(() => makeNode('a'), ctx)
      node.handleSelect({ stopPropagation: vi.fn() } as unknown as MouseEvent)
      expect(ctx.engine.store.selectNode).not.toHaveBeenCalled()
    })

    it('selects when before hook returns true', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      ctx.eventHooks = { onBeforeSelect: () => true }
      const node = useWidgetNode(() => makeNode('a'), ctx)
      node.handleSelect({ stopPropagation: vi.fn() } as unknown as MouseEvent)
      expect(ctx.engine.store.selectNode).toHaveBeenCalledWith('a')
    })

    it('fires after hook on successful selection', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const afterHook = vi.fn()
      ctx.eventHooks = { onAfterSelect: afterHook }
      const node = useWidgetNode(() => makeNode('a'), ctx)
      node.handleSelect({ stopPropagation: vi.fn() } as unknown as MouseEvent)
      expect(afterHook).toHaveBeenCalledWith({ nodeId: 'a' })
    })
  })

  describe('hover', () => {
    it('handleMouseEnter calls hoverNode', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      node.handleMouseEnter()
      expect(ctx.engine.store.hoverNode).toHaveBeenCalledWith('a')
    })

    it('handleMouseLeave clears hover', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text'))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      node.handleMouseLeave()
      expect(ctx.engine.store.hoverNode).toHaveBeenCalledWith(null)
    })
  })
})
