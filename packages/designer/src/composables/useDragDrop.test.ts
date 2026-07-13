// @vitest-environment happy-dom
import type { DesignerEngine, DesignerSchema, SchemaNode, WidgetMeta } from '@dragcraft/core'
import { CommandType, createEngine } from '@dragcraft/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDragDrop } from './useDragDrop'

function makeNode(id: string, type = 'text', layout?: SchemaNode['layout']): SchemaNode {
  return { id, type, props: {}, layout }
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
      setDragImage: vi.fn(),
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
    expect(dd.forbiddenReason.value).toBeNull()
  })

  it('handleMaterialDragStart sets dragTarget with widgetType even when creatable is false', () => {
    const dd = useDragDrop(engine)
    const meta = makeMeta('image', { creatable: false })
    const e = mockDragEvent()
    dd.handleMaterialDragStart(e, meta)
    expect(engine.store.dragTarget.value).toEqual({
      sourceNodeId: null,
      widgetType: 'image',
    })
    expect(e.dataTransfer!.effectAllowed).toBe('copy')
    expect(e.dataTransfer!.setDragImage).toHaveBeenCalled()
  })

  it('handleCanvasDrop adds new widget from material panel', () => {
    const dd = useDragDrop(engine)
    const execute = vi.spyOn(engine, 'execute')
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
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      type: CommandType.ADD_NODE,
      payload: expect.objectContaining({
        destination: { kind: 'root', sortScope: 'content', index: 0 },
      }),
    }))
    expect(engine.store.dragTarget.value).toBeNull()
  })

  it('handleCanvasDrop moves existing node', () => {
    const dd = useDragDrop(engine)
    const execute = vi.spyOn(engine, 'execute')
    const e = mockDragEvent()

    // Existing node drag starts in renderer and shares the same dragTarget store.
    engine.store.setDragTarget({ sourceNodeId: 'a', widgetType: null })

    // Simulate drag over to index 2 (after 'b')
    dd.dragOverIndex.value = 2

    // Drop
    dd.handleCanvasDrop(e)

    const children = engine.store.schema.value.root.children!
    expect(children).toHaveLength(2)
    // 'a' moved after 'b'
    expect(children[0].id).toBe('b')
    expect(children[1].id).toBe('a')
    expect(execute).toHaveBeenCalledWith({
      type: CommandType.MOVE_NODE,
      payload: {
        nodeId: 'a',
        destination: { kind: 'root', sortScope: 'content', index: 2 },
      },
    })
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
      creatable: () => ({
        allowed: false,
        code: 'singleton',
        messageKey: 'forbidden.singleton',
        message: 'Only one singleton is allowed',
      }),
    }))
    const dd = useDragDrop(engine)
    const spy = vi.spyOn(engine, 'execute')
    const e = mockDragEvent()

    dd.handleMaterialDragStart(e, makeMeta('singleton'))
    dd.handleCanvasDragOver(e)
    dd.dragOverIndex.value = 0

    expect(dd.isForbidden.value).toBe(true)
    expect(dd.forbiddenReason.value).toEqual({
      code: 'singleton',
      messageKey: 'forbidden.singleton',
      message: 'Only one singleton is allowed',
    })
    expect(e.dataTransfer!.dropEffect).toBe('none')

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
    dd.forbiddenReason.value = { code: 'test', message: 'Blocked' }
    engine.store.setDragTarget({ sourceNodeId: 'a', widgetType: null })

    dd.handleDragEnd(mockDragEvent())
    expect(dd.dragOverNodeId.value).toBeNull()
    expect(dd.dragOverIndex.value).toBeNull()
    expect(dd.isForbidden.value).toBe(false)
    expect(dd.forbiddenReason.value).toBeNull()
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

  it('chrome material drops create outside the content sort scope', () => {
    const dd = useDragDrop(engine)
    const meta = makeMeta('tabbar', {
      defaultLayout: { placement: { kind: 'chrome', edge: 'block-end' } },
    })
    engine.registerWidget(meta)
    const e = mockDragEvent()

    dd.handleMaterialDragStart(e, meta)
    dd.dragOverIndex.value = null
    dd.handleCanvasDrop(e)

    const children = engine.store.schema.value.root.children!
    expect(children).toHaveLength(3)
    expect(children[2]).toMatchObject({
      type: 'tabbar',
      layout: { placement: { kind: 'chrome', edge: 'block-end' } },
    })
  })

  it('handleCanvasDrop inserts by content sort-scope index when chrome nodes exist', () => {
    engine.execute({
      type: CommandType.ADD_NODE,
      payload: { node: makeNode('t', 'tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }) },
    })
    // children: [a, b, t(tabbar)]

    const dd = useDragDrop(engine)
    const meta = makeMeta('image')
    engine.registerWidget(meta)
    const e = mockDragEvent()

    dd.handleMaterialDragStart(e, meta)
    // Content scope index 2 = after a and b; tabbar remains outside sorting.
    dd.dragOverIndex.value = 2
    dd.handleCanvasDrop(e)

    const children = engine.store.schema.value.root.children!
    expect(children).toHaveLength(4)
    expect(children.map(c => c.type)).toEqual(['text', 'button', 'image', 'tabbar'])
  })
})
