// @vitest-environment happy-dom
import type { DesignerEngine, DesignerSchema, SchemaNode, WidgetMeta } from '@dragcraft/core'
import { CommandType, createEngine } from '@dragcraft/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDragDrop } from './useDragDrop'

function makeNode(id: string, type = 'text'): SchemaNode {
  return { id, type, props: {} }
}

function makeMeta(type: string, overrides?: Partial<WidgetMeta>): WidgetMeta {
  return {
    type,
    title: type,
    group: 'basic',
    defaultProps: { content: 'default' },
    formSchema: { sections: [] },
    ...overrides,
  } as WidgetMeta
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function mockDragEvent(overrides?: Partial<DragEvent>): DragEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientX: 100,
    clientY: 200,
    dataTransfer: {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
    },
    currentTarget: document.createElement('div'),
    relatedTarget: null,
    ...overrides,
  } as unknown as DragEvent
}

describe('useDragDrop', () => {
  let engine: DesignerEngine

  beforeEach(() => {
    engine = createEngine({
      initialSchema: makeSchema([makeNode('a', 'text'), makeNode('b', 'button')]),
    })
    engine.registerWidget(makeMeta('text'))
    engine.registerWidget(makeMeta('button'))
  })

  it('initial state has no drag-over', () => {
    const dd = useDragDrop(engine)
    expect(dd.dragOverNodeId.value).toBeNull()
    expect(dd.dragOverIndex.value).toBeNull()
    expect(dd.isForbidden.value).toBe(false)
  })

  it('handleMaterialDragStart sets dragTarget with widgetType', () => {
    const dd = useDragDrop(engine)
    const meta = makeMeta('image')
    const e = mockDragEvent()
    dd.handleMaterialDragStart(e, meta)
    expect(engine.store.dragTarget.value).toEqual({
      sourceNodeId: null,
      widgetType: 'image',
    })
    expect(e.dataTransfer!.effectAllowed).toBe('copy')
    dd.destroyDragPreview()
  })

  it('handleNodeDragStart sets dragTarget with sourceNodeId', () => {
    const dd = useDragDrop(engine)
    const e = mockDragEvent()
    dd.handleNodeDragStart(e, 'a')
    expect(engine.store.dragTarget.value).toEqual({
      sourceNodeId: 'a',
      widgetType: null,
    })
    expect(e.dataTransfer!.effectAllowed).toBe('move')
    dd.destroyDragPreview()
  })

  it('handleCanvasDrop adds new widget from material panel', () => {
    const dd = useDragDrop(engine)
    const meta = makeMeta('image')
    engine.registerWidget(meta)
    const e = mockDragEvent()

    // Simulate drag start from material panel
    dd.handleMaterialDragStart(e, meta)

    // Simulate drag over to compute index
    dd.dragOverIndex.value = 0

    // Drop
    dd.handleCanvasDrop(e)

    const children = engine.store.schema.value.root.children!
    expect(children).toHaveLength(3)
    expect(children[0].type).toBe('image')
    expect(children[0].props).toEqual({ content: 'default' })
    expect(engine.store.dragTarget.value).toBeNull()
  })

  it('handleCanvasDrop moves existing node', () => {
    const dd = useDragDrop(engine)
    const e = mockDragEvent()

    // Simulate drag start of existing node 'a'
    dd.handleNodeDragStart(e, 'a')

    // Simulate drag over to index 2 (after 'b')
    dd.dragOverIndex.value = 2

    // Drop
    dd.handleCanvasDrop(e)

    const children = engine.store.schema.value.root.children!
    expect(children).toHaveLength(2)
    // 'a' moved after 'b'
    expect(children[0].id).toBe('b')
    expect(children[1].id).toBe('a')
  })

  it('handleCanvasDrop does nothing when no dragTarget', () => {
    const dd = useDragDrop(engine)
    const spy = vi.spyOn(engine, 'execute')
    const e = mockDragEvent()
    dd.handleCanvasDrop(e)
    expect(spy).not.toHaveBeenCalled()
  })

  it('handleCanvasDrop does nothing when visualIndex is null', () => {
    const dd = useDragDrop(engine)
    const spy = vi.spyOn(engine, 'execute')
    const meta = makeMeta('image')
    const e = mockDragEvent()
    dd.handleMaterialDragStart(e, meta)
    dd.dragOverIndex.value = null
    dd.handleCanvasDrop(e)
    expect(spy).not.toHaveBeenCalled()
  })

  it('handleCanvasDrop respects creatable predicate (forbidden)', () => {
    engine.registerWidget(makeMeta('singleton', {
      creatable: () => false,
    }))
    const dd = useDragDrop(engine)
    const spy = vi.spyOn(engine, 'execute')
    const e = mockDragEvent()

    dd.handleMaterialDragStart(e, makeMeta('singleton'))
    dd.dragOverIndex.value = 0
    dd.handleCanvasDrop(e)

    expect(spy).not.toHaveBeenCalled()
    expect(engine.store.dragTarget.value).toBeNull()
  })

  it('handleCanvasDrop blocks drop when isForbidden is true', () => {
    engine.registerWidget(makeMeta('singleton', {
      creatable: (ctx) => {
        const children = ctx.schema.root.children ?? []
        return !children.some(c => c.type === 'singleton')
      },
    }))
    // Add a singleton node
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('s', 'singleton') } })

    const dd = useDragDrop(engine)
    const spy = vi.spyOn(engine, 'execute')
    const e = mockDragEvent()

    dd.handleMaterialDragStart(e, makeMeta('singleton'))
    dd.dragOverIndex.value = 0

    // isDropAllowed should be false since singleton already exists
    dd.handleCanvasDrop(e)
    expect(spy).not.toHaveBeenCalled()
  })

  it('handleDragEnd cleans up state', () => {
    const dd = useDragDrop(engine)
    dd.dragOverNodeId.value = 'root'
    dd.dragOverIndex.value = 2
    dd.isForbidden.value = true
    engine.store.setDragTarget({ sourceNodeId: 'a', widgetType: null })

    dd.handleDragEnd(mockDragEvent())
    expect(dd.dragOverNodeId.value).toBeNull()
    expect(dd.dragOverIndex.value).toBeNull()
    expect(dd.isForbidden.value).toBe(false)
    expect(engine.store.dragTarget.value).toBeNull()
  })

  it('handleCanvasDragLeave clears state when leaving canvas', () => {
    const dd = useDragDrop(engine)
    dd.dragOverNodeId.value = 'root'
    dd.dragOverIndex.value = 1

    const canvasEl = document.createElement('div')
    const e = {
      preventDefault: vi.fn(),
      currentTarget: canvasEl,
      relatedTarget: document.createElement('div'), // outside canvas
    } as unknown as DragEvent

    dd.handleCanvasDragLeave(e)
    expect(dd.dragOverNodeId.value).toBeNull()
    expect(dd.dragOverIndex.value).toBeNull()
  })

  it('lockedIndices reacts to schema changes', () => {
    engine.registerWidget(makeMeta('locked', { sortable: false }))
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('l', 'locked') } })

    const dd = useDragDrop(engine)
    expect(dd.lockedIndices.value.size).toBe(1)
    expect(dd.lockedIndices.value.has(2)).toBe(true)
  })
})
