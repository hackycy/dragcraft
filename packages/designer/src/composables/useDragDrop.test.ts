// @vitest-environment happy-dom
import type { ContainerDefinition, DesignerEngine, DesignerSchema, SchemaNode, WidgetMeta } from '@dragcraft/core'
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

const splitDefinition: ContainerDefinition = {
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
}

function makeContainer(
  id = 'layout',
  regions: Record<string, SchemaNode[]> = { left: [], right: [] },
): SchemaNode {
  return {
    id,
    type: 'split-layout',
    props: {},
    container: { variant: 'split', regions },
  }
}

function makeContainerEngine(
  regions: Record<string, SchemaNode[]> = { left: [], right: [] },
  definition: ContainerDefinition = splitDefinition,
  extraRootNodes: SchemaNode[] = [],
): DesignerEngine {
  const result = createEngine({
    initialSchema: makeSchema([makeContainer('layout', regions), ...extraRootNodes]),
  })
  result.registerWidget(makeMeta('text'))
  result.registerWidget(makeMeta('image'))
  result.registerWidget(makeMeta('split-layout', { container: definition }))
  return result
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

  it('adds a material to the active container destination without mutating during preflight', () => {
    engine = makeContainerEngine()
    const dd = useDragDrop(engine)
    const event = mockDragEvent()
    const schemaBefore = engine.exportSchema()

    dd.handleMaterialDragStart(event, makeMeta('image'))
    dd.handleContainerDragOver({
      event,
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })

    expect(dd.activeDestination.value).toEqual({
      kind: 'container',
      containerId: 'layout',
      regionId: 'left',
      index: 0,
    })
    expect(dd.containerDropDecision.value).toEqual({ allowed: true })
    expect(engine.exportSchema()).toEqual(schemaBefore)

    const result = dd.handleContainerDrop(event)
    expect(result.ok).toBe(true)
    expect(engine.state.getNodeById('layout')!.container!.regions.left[0]).toMatchObject({
      type: 'image',
      props: { content: 'default' },
    })
  })

  it('moves a nested node back to the active root destination', () => {
    engine = makeContainerEngine({ left: [makeNode('nested')], right: [] })
    const dd = useDragDrop(engine)
    engine.store.setDragTarget({ sourceNodeId: 'nested', widgetType: null })
    dd.activeDestination.value = { kind: 'root', sortScope: 'content', index: 0 }

    const result = dd.handleCanvasDrop(mockDragEvent())

    expect(result.ok).toBe(true)
    expect(engine.state.getSchema().root.children![0].id).toBe('nested')
    expect(engine.state.getNodeById('layout')!.container!.regions.left).toEqual([])
  })

  it('moves a nested node between container regions using the resolved index', () => {
    engine = makeContainerEngine({ left: [makeNode('nested')], right: [makeNode('right')] })
    const dd = useDragDrop(engine)
    engine.store.setDragTarget({ sourceNodeId: 'nested', widgetType: null })
    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'right', index: 1 },
    })

    const result = dd.commitDrop()

    expect(result.ok).toBe(true)
    expect(engine.state.getNodeById('layout')!.container!.regions).toMatchObject({
      left: [],
      right: [{ id: 'right' }, { id: 'nested' }],
    })
  })

  it('reorders a nested node within the same region using Core index adjustment', () => {
    engine = makeContainerEngine({ left: [makeNode('nested'), makeNode('second')], right: [] })
    const dd = useDragDrop(engine)
    engine.store.setDragTarget({ sourceNodeId: 'nested', widgetType: null })
    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 2 },
    })

    const result = dd.commitDrop()

    expect(result.ok).toBe(true)
    expect(engine.state.getNodeById('layout')!.container!.regions.left.map(node => node.id))
      .toEqual(['second', 'nested'])
  })

  it('surfaces a container adapter rejection', () => {
    engine = makeContainerEngine()
    const dd = useDragDrop(engine)

    dd.handleContainerDragOver({
      event: mockDragEvent(),
      containerId: 'layout',
      regionId: 'left',
      allowed: false,
      code: 'CONTAINER_DROP_ADAPTER_FAILED',
      message: 'Adapter failed',
    })

    expect(dd.containerDropDecision.value).toEqual({
      allowed: false,
      code: 'CONTAINER_DROP_ADAPTER_FAILED',
      message: 'Adapter failed',
    })
    expect(dd.isForbidden.value).toBe(true)
    expect(dd.forbiddenReason.value).toMatchObject({
      code: 'CONTAINER_DROP_ADAPTER_FAILED',
      message: 'Adapter failed',
    })
  })

  it.each([
    {
      name: 'region cardinality',
      definition: {
        ...splitDefinition,
        variants: {
          split: {
            title: 'Split',
            regions: [
              { id: 'left', title: 'Left', constraints: { maxItems: 1 } },
              { id: 'right', title: 'Right' },
            ],
          },
        },
      } satisfies ContainerDefinition,
      regions: { left: [makeNode('full')], right: [] },
      source: { sourceNodeId: null, widgetType: 'image' },
      code: 'CONTAINER_REGION_MAX_ITEMS',
    },
    {
      name: 'placement predicate',
      definition: {
        ...splitDefinition,
        canPlace: () => ({
          allowed: false,
          code: 'CUSTOM_PLACEMENT_DENIED',
          message: 'Not here',
          details: { policy: 'editorial' },
        }),
      } satisfies ContainerDefinition,
      regions: { left: [], right: [] },
      source: { sourceNodeId: null, widgetType: 'image' },
      code: 'CUSTOM_PLACEMENT_DENIED',
    },
    {
      name: 'container nesting',
      definition: splitDefinition,
      regions: { left: [], right: [] },
      source: { sourceNodeId: 'other-layout', widgetType: null },
      code: 'CONTAINER_NESTING_FORBIDDEN',
    },
  ])('preflights $name rejection without changing schema', ({ definition, regions, source, code }) => {
    engine = makeContainerEngine(regions, definition, [makeContainer('other-layout')])
    const dd = useDragDrop(engine)
    const schemaBefore = engine.exportSchema()
    engine.store.setDragTarget(source)

    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })

    expect(dd.containerDropDecision.value).toMatchObject({ allowed: false, code })
    expect(dd.forbiddenReason.value).toMatchObject({ code })
    expect(engine.exportSchema()).toEqual(schemaBefore)
  })

  it('surfaces the final Core rejection even after a successful preflight', () => {
    engine = makeContainerEngine()
    const dd = useDragDrop(engine)
    dd.handleMaterialDragStart(mockDragEvent(), makeMeta('image'))
    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })
    vi.spyOn(engine, 'execute').mockReturnValue({
      ok: false,
      code: 'CONTAINER_REGION_MAX_ITEMS',
      message: 'Full',
      details: { maxItems: 0 },
    })

    const result = dd.commitDrop()

    expect(result).toMatchObject({ ok: false, code: 'CONTAINER_REGION_MAX_ITEMS' })
    expect(dd.isForbidden.value).toBe(true)
    expect(dd.forbiddenReason.value).toMatchObject({
      code: 'CONTAINER_REGION_MAX_ITEMS',
      message: 'Full',
      details: { maxItems: 0 },
    })
    expect(dd.containerDropDecision.value).toMatchObject({
      allowed: false,
      code: 'CONTAINER_REGION_MAX_ITEMS',
      message: 'Full',
      details: { maxItems: 0 },
    })
    expect(dd.activeDestination.value).not.toBeNull()
  })

  it('keeps the active container destination while moving within its region', () => {
    engine = makeContainerEngine()
    const dd = useDragDrop(engine)
    dd.handleMaterialDragStart(mockDragEvent(), makeMeta('image'))
    const region = document.createElement('section')
    const child = document.createElement('span')
    region.appendChild(child)
    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })

    dd.handleContainerDragLeave(mockDragEvent({ currentTarget: region, relatedTarget: child }))

    expect(dd.activeDestination.value).toMatchObject({ kind: 'container', regionId: 'left' })
  })

  it('clears container state when leaving its region and at drag end', () => {
    engine = makeContainerEngine()
    const dd = useDragDrop(engine)
    dd.handleMaterialDragStart(mockDragEvent(), makeMeta('image'))
    const region = document.createElement('section')
    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })

    dd.handleContainerDragLeave(mockDragEvent({
      currentTarget: region,
      relatedTarget: document.createElement('div'),
    }))
    expect(dd.activeDestination.value).toBeNull()
    expect(dd.containerDropDecision.value).toBeNull()

    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })
    dd.handleDragEnd(mockDragEvent())
    expect(dd.activeDestination.value).toBeNull()
    expect(dd.containerDropDecision.value).toBeNull()
    expect(engine.store.dragTarget.value).toBeNull()
  })

  it('does not let a nested outlet dragover replace its container destination with root', () => {
    engine = makeContainerEngine()
    const dd = useDragDrop(engine)
    dd.handleMaterialDragStart(mockDragEvent(), makeMeta('image'))
    dd.handleContainerDragOver({
      event: mockDragEvent(),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })
    const canvas = document.createElement('div')
    const region = document.createElement('section')
    region.dataset.dcContainerRegion = 'left'
    const child = document.createElement('span')
    region.appendChild(child)
    canvas.appendChild(region)

    dd.handleCanvasDragOver(mockDragEvent({ currentTarget: canvas, target: child }))

    expect(dd.activeDestination.value).toMatchObject({
      kind: 'container',
      containerId: 'layout',
      regionId: 'left',
      index: 0,
    })
  })
})
