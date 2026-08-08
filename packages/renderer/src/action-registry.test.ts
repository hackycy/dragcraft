import type { Command, DesignerEngine, DesignerSchema, SchemaNode } from '@dragcraft/core'
import type { NodeActionContext } from './action-registry'
import type { ActionInterceptor } from './action-runtime'
import type { RendererWidgetMeta } from './types'
import { CommandType, createContainerPlan, getLockedIndices, getLockedIndicesFromNodes, isInsertAllowed, isMoveAllowed, isRemoveAllowed, resolveAuthoringCapability, resolveNodeLayout, validateSubtreeCreation, validateSubtreeDeletion } from '@dragcraft/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActionKey, createDefaultActions, createNodeActionRegistry } from './action-registry'

// Minimal MouseEvent stub for Node environment
function mockEvent(): MouseEvent {
  return { stopPropagation: vi.fn(), type: 'click' } as unknown as MouseEvent
}

// Mock @dragcraft/core
vi.mock('@dragcraft/core', async () => {
  const actual = await vi.importActual<typeof import('@dragcraft/core')>('@dragcraft/core')
  return {
    ...actual,
    getLockedIndices: vi.fn(() => new Set<number>()),
    getLockedIndicesFromNodes: vi.fn(() => new Set<number>()),
    isInsertAllowed: vi.fn(() => true),
    isMoveAllowed: vi.fn(() => true),
    isRemoveAllowed: vi.fn(() => true),
  }
})

function makeNode(overrides?: Partial<SchemaNode>): SchemaNode {
  return {
    id: 'node-1',
    type: 'button',
    props: {},
    ...overrides,
  }
}

function makeEngine(overrides?: Partial<DesignerEngine>): DesignerEngine {
  const schema: DesignerSchema = { version: '1', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children: [] } }
  return {
    store: {
      schema: { value: schema },
      selectedNodeId: { value: null },
      hoveredNodeId: { value: null },
      dragTarget: { value: null },
    } as unknown as DesignerEngine['store'],
    state: {
      getSchema: () => schema,
      getNodeById: (id: string) => schema.root.children?.find(node => node.id === id) ?? null,
      getSelectedNodeId: () => null,
      getHoveredNodeId: () => null,
      getDragTarget: () => null,
    },
    registry: {
      getWidget: vi.fn(() => undefined),
    } as unknown as DesignerEngine['registry'],
    execute: vi.fn(),
    ...overrides,
  } as DesignerEngine
}

function makeMeta(overrides?: Partial<RendererWidgetMeta>): RendererWidgetMeta {
  return {
    type: 'button',
    title: 'Button',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  } as RendererWidgetMeta
}

function makeCtx(engine: DesignerEngine, overrides?: Partial<NodeActionContext>): NodeActionContext {
  const execute = (action: { type: string, nodeId?: string, destination?: unknown }) => {
    const command: Command = action.type === 'node.move'
      ? { type: CommandType.MOVE_NODE, payload: { nodeId: action.nodeId, destination: action.destination } }
      : action.type === 'node.remove'
        ? { type: CommandType.REMOVE_NODE, payload: { nodeId: action.nodeId } }
        : { type: CommandType.DUPLICATE_NODE, payload: { nodeId: action.nodeId } }
    return engine.execute(command)
  }
  const context = {
    node: makeNode(),
    owner: { kind: 'root', sortScope: 'content' },
    index: 0,
    siblingCount: 3,
    sortScope: 'content',
    meta: makeMeta(),
    session: { execute },
    schema: engine.state.getSchema(),
    ...overrides,
  } as NodeActionContext
  context.materials = {
    get: type => type === context.node.type
      ? context.meta
      : engine.registry.getWidget(type) as RendererWidgetMeta | undefined,
    getAll: () => [],
    resolveCapability: (node, capability) => resolveAuthoringCapability(
      node.id === context.node.id ? context.meta : engine.registry.getWidget(node.type),
      { node, schema: context.schema },
      capability,
    ),
    resolveLayout: node => resolveNodeLayout(node as SchemaNode, engine.registry, context.schema as DesignerSchema),
    resolveContainer: node => createContainerPlan(node as SchemaNode, engine.registry),
    getLockedIndices: nodes => getLockedIndicesFromNodes(
      nodes as SchemaNode[],
      engine.registry,
      context.schema as DesignerSchema,
    ),
    canCreateSubtree: node => validateSubtreeCreation(
      node,
      context.schema,
      engine.registry,
    ).ok,
    canDeleteSubtree: node => validateSubtreeDeletion(
      node,
      context.schema,
      engine.registry,
    ).ok,
  }
  return context
}

it('accepts renderer-specific widget metadata with Vue UI fields', () => {
  const meta: RendererWidgetMeta = {
    type: 'text',
    title: 'Text',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    actions: { exclude: ['delete'] },
  }

  expect(meta.actions?.exclude).toEqual(['delete'])
})

describe('createDefaultActions', () => {
  it('returns 5 built-in actions sorted by order', () => {
    const actions = createDefaultActions()
    expect(actions).toHaveLength(5)
    expect(actions.map(a => a.key)).toEqual([
      ActionKey.DRAG,
      ActionKey.MOVE_UP,
      ActionKey.MOVE_DOWN,
      ActionKey.DUPLICATE,
      ActionKey.DELETE,
    ])
    expect(actions.map(a => a.order)).toEqual([100, 200, 300, 350, 400])
  })

  it('keeps structural availability separate from policy authorization', () => {
    const actions = createDefaultActions()
    const dragAction = actions.find(a => a.key === ActionKey.DRAG)!
    const moveUpAction = actions.find(a => a.key === ActionKey.MOVE_UP)!
    const deleteAction = actions.find(a => a.key === ActionKey.DELETE)!

    // visible should always be true (or undefined) — actions conceptually apply
    expect(dragAction.visible).toBeUndefined()
    expect(moveUpAction.visible).toBeUndefined()
    expect(deleteAction.visible).toBeUndefined()

    // Capability authorization happens in the registry; definitions only
    // describe structural availability that can change with position.
    const ctx = makeCtx(makeEngine(), {
      node: { id: 'n', type: 't', props: {} },
      meta: makeMeta({ draggable: false, deletable: false }),
      siblingCount: 1,
      sortScope: false,
    })
    expect(dragAction.available!(ctx as any)).toBe(false)
    expect(moveUpAction.available!(ctx as any)).toBe(false)
    expect(deleteAction.available).toBeUndefined()
  })
})

describe('createNodeActionRegistry', () => {
  it('registers default actions on creation', () => {
    const registry = createNodeActionRegistry()
    expect(registry.getActions()).toHaveLength(5)
  })

  it('accepts custom initial actions', () => {
    const custom = [{ key: 'custom', label: 'Custom', type: 'button' as const, order: 50 }]
    const registry = createNodeActionRegistry(custom)
    expect(registry.getActions()).toHaveLength(1)
    expect(registry.getActions()[0].key).toBe('custom')
  })

  it('register adds a new action', () => {
    const registry = createNodeActionRegistry()
    registry.register({ key: 'extra', label: 'Extra', type: 'button', order: 500 })
    expect(registry.getActions()).toHaveLength(6)
  })

  it('unregister removes an action', () => {
    const registry = createNodeActionRegistry()
    registry.unregister(ActionKey.DELETE)
    expect(registry.getActions().find(a => a.key === ActionKey.DELETE)).toBeUndefined()
  })

  it('getActions returns actions sorted by order', () => {
    const registry = createNodeActionRegistry()
    registry.register({ key: 'first', label: 'First', type: 'button', order: 10 })
    const orders = registry.getActions().map(a => a.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })
})

describe('resolve', () => {
  let engine: DesignerEngine
  let emptyInterceptors: ActionInterceptor[]

  beforeEach(() => {
    engine = makeEngine()
    emptyInterceptors = []
    vi.mocked(getLockedIndices).mockReset().mockReturnValue(new Set<number>())
    vi.mocked(getLockedIndicesFromNodes).mockReset().mockReturnValue(new Set<number>())
    vi.mocked(isMoveAllowed).mockReset().mockReturnValue(true)
    vi.mocked(isInsertAllowed).mockReset().mockReturnValue(true)
    vi.mocked(isRemoveAllowed).mockReset().mockReturnValue(true)
  })

  it('returns visible actions for a basic node', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    // All 5 default actions visible by default (resolveBehavior mocked to return true)
    expect(resolved).toHaveLength(5)
    expect(resolved.every(a => a.visible)).toBe(true)
  })

  it('disables built-in actions when the corresponding capability is unauthorized', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, { meta: makeMeta({ draggable: false }) })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const drag = resolved.find(a => a.key === ActionKey.DRAG)
    expect(drag?.disabled).toBe(true)
    expect(resolved.find(a => a.key === ActionKey.MOVE_UP)?.disabled).toBe(true)
    expect(resolved.find(a => a.key === ActionKey.MOVE_DOWN)?.disabled).toBe(true)
  })

  it('keeps all built-in actions disabled for a schema-managed widget', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, { meta: makeMeta({ authoring: 'schema-managed' }) })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved.map(action => action.key)).toEqual([
      ActionKey.DRAG,
      ActionKey.MOVE_UP,
      ActionKey.MOVE_DOWN,
      ActionKey.DUPLICATE,
      ActionKey.DELETE,
    ])
    expect(resolved.every(action => action.disabled)).toBe(true)
  })

  it('disables duplicate and delete when an ordinary container has a schema-managed descendant', () => {
    const ordinaryMeta = makeMeta({ type: 'layout' })
    const managedMeta = makeMeta({ type: 'managed', authoring: 'schema-managed' })
    vi.mocked(engine.registry.getWidget).mockImplementation(type =>
      type === 'managed' ? managedMeta : ordinaryMeta,
    )
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, {
      node: makeNode({
        type: 'layout',
        container: {
          variant: 'single',
          regions: {
            content: [makeNode({ id: 'managed-child', type: 'managed' })],
          },
        },
      }),
      meta: ordinaryMeta,
    })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved.find(action => action.key === ActionKey.DUPLICATE)?.disabled).toBe(true)
    expect(resolved.find(action => action.key === ActionKey.DELETE)?.disabled).toBe(true)
  })

  it('derives movement and deletion actions from explicit schema-managed overrides', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, {
      index: 1,
      meta: makeMeta({
        authoring: 'schema-managed',
        draggable: true,
        deletable: true,
      }),
    })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved.find(action => action.key === ActionKey.DRAG)?.disabled).toBe(false)
    expect(resolved.find(action => action.key === ActionKey.MOVE_UP)?.disabled).toBe(false)
    expect(resolved.find(action => action.key === ActionKey.MOVE_DOWN)?.disabled).toBe(false)
    expect(resolved.find(action => action.key === ActionKey.DUPLICATE)?.disabled).toBe(true)
    expect(resolved.find(action => action.key === ActionKey.DELETE)?.disabled).toBe(false)
  })

  it('requires actions.only to admit global custom actions for schema-managed widgets', () => {
    const registry = createNodeActionRegistry()
    registry.register({ key: 'inspect', label: 'Inspect', type: 'button', order: 500 })

    const defaults = registry.resolve(makeCtx(engine, {
      meta: makeMeta({ authoring: 'schema-managed' }),
    }), emptyInterceptors)
    expect(defaults.map(action => action.key)).not.toContain('inspect')
    expect(registry.resolve(makeCtx(engine, {
      meta: makeMeta({ authoring: 'schema-managed', actions: { only: ['inspect'] } }),
    }), emptyInterceptors).map(action => action.key)).toEqual(['inspect'])
  })

  it('admits schema-managed extra actions but never duplicate', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, {
      meta: makeMeta({
        authoring: 'schema-managed',
        actions: {
          extra: [
            { key: 'inspect', label: 'Inspect', type: 'button', order: 10 },
            { key: ActionKey.DUPLICATE, label: 'Duplicate', type: 'button', order: 20 },
          ],
        },
      }),
    })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved.filter(action => action.key === ActionKey.DUPLICATE)).toHaveLength(1)
    expect(resolved.find(action => action.key === ActionKey.DUPLICATE)?.disabled).toBe(true)
    expect(resolved.find(action => action.key === 'inspect')?.disabled).toBe(false)
  })

  it('applies widgetActions.only filter', () => {
    const registry = createNodeActionRegistry()
    const meta = makeMeta({ actions: { only: [ActionKey.DELETE] } })
    const ctx = makeCtx(engine, { meta })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].key).toBe(ActionKey.DELETE)
  })

  it('applies widgetActions.exclude filter', () => {
    const registry = createNodeActionRegistry()
    const meta = makeMeta({ actions: { exclude: [ActionKey.DRAG, ActionKey.MOVE_UP, ActionKey.MOVE_DOWN, ActionKey.DUPLICATE] } })
    const ctx = makeCtx(engine, { meta })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].key).toBe(ActionKey.DELETE)
  })

  it('applies widgetActions.extra additions', () => {
    const registry = createNodeActionRegistry()
    const extraAction = {
      key: 'custom',
      label: 'Custom',
      type: 'button' as const,
      order: 50,
    }
    const meta = makeMeta({ actions: { extra: [extraAction] } })
    const ctx = makeCtx(engine, { meta })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved).toHaveLength(6)
    expect(resolved[0].key).toBe('custom') // order 50 comes first
  })

  it('applies requested action keys to widget extras', () => {
    const registry = createNodeActionRegistry()
    const meta = makeMeta({
      actions: {
        extra: [{ key: 'custom', label: 'Custom', type: 'button', order: 50 }],
      },
    })
    const ctx = makeCtx(engine, { meta })

    expect(registry.resolve(ctx, emptyInterceptors, [ActionKey.DELETE])
      .map(action => action.key)).toEqual([ActionKey.DELETE])
  })

  it('move-up handler calls engine.execute with correct payload', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, { index: 1 })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const moveUp = resolved.find(a => a.key === ActionKey.MOVE_UP)!
    moveUp.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalledWith({
      type: 'MOVE_NODE',
      payload: { nodeId: 'node-1', destination: { kind: 'root', index: 0, sortScope: 'content' } },
    })
  })

  it('move-down handler calls engine.execute with correct payload', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, { index: 1 })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const moveDown = resolved.find(a => a.key === ActionKey.MOVE_DOWN)!
    moveDown.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalledWith({
      type: 'MOVE_NODE',
      payload: { nodeId: 'node-1', destination: { kind: 'root', index: 3, sortScope: 'content' } },
    })
  })

  it('allows reordering container-owned siblings without a page sort scope', () => {
    ;(engine.state.getSchema() as DesignerSchema).root.children = [makeNode({ id: 'root-lock', type: 'locked' })]
    vi.mocked(getLockedIndices).mockReturnValue(new Set([0]))
    vi.mocked(isMoveAllowed).mockReturnValue(false)
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, {
      owner: { kind: 'container', containerId: 'layout', regionId: 'left' },
      index: 1,
      sortScope: false,
    })

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const moveUp = resolved.find(action => action.key === ActionKey.MOVE_UP)!
    moveUp.handler(mockEvent())

    expect(moveUp.disabled).toBe(false)
    expect(getLockedIndices).not.toHaveBeenCalled()
    expect(engine.execute).toHaveBeenCalledWith({
      type: 'MOVE_NODE',
      payload: {
        nodeId: 'node-1',
        destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
      },
    })
  })

  it('disables container actions that would shift an absolute-index lock', () => {
    vi.mocked(getLockedIndicesFromNodes).mockReturnValue(new Set([1]))
    vi.mocked(isMoveAllowed).mockReturnValue(false)
    vi.mocked(isRemoveAllowed).mockReturnValue(false)
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, {
      owner: { kind: 'container', containerId: 'layout', regionId: 'left' },
      index: 0,
      siblingCount: 2,
      sortScope: false,
    })

    const resolved = registry.resolve(ctx, emptyInterceptors)

    expect(resolved.find(action => action.key === ActionKey.MOVE_DOWN)?.disabled).toBe(true)
    expect(resolved.find(action => action.key === ActionKey.DELETE)?.disabled).toBe(true)
    expect(getLockedIndicesFromNodes).toHaveBeenCalledTimes(3)
  })

  it('keeps duplicate enabled for an unsorted root node regardless of content locks', () => {
    vi.mocked(getLockedIndices).mockReturnValue(new Set([0]))
    vi.mocked(isInsertAllowed).mockReturnValue(false)
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, {
      owner: { kind: 'root' },
      index: -1,
      siblingCount: 0,
      sortScope: false,
    })

    const duplicate = registry.resolve(ctx, emptyInterceptors)
      .find(action => action.key === ActionKey.DUPLICATE)

    expect(duplicate?.disabled).toBe(false)
    expect(getLockedIndices).not.toHaveBeenCalled()
  })

  it('delete handler calls engine.execute with correct payload', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalledWith({
      type: 'REMOVE_NODE',
      payload: { nodeId: 'node-1' },
    })
  })

  it('duplicate handler calls engine.execute with correct payload', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const duplicate = resolved.find(a => a.key === ActionKey.DUPLICATE)!
    duplicate.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalledWith({
      type: 'DUPLICATE_NODE',
      payload: { nodeId: 'node-1' },
    })
  })

  it('sync before-action interceptor returning false cancels delete', () => {
    const beforeAction = vi.fn((invocation) => {
      expect(invocation.key).toBe(ActionKey.DELETE)
      expect(invocation.risk).toBe('destructive')
      expect(invocation.command).toEqual({
        type: 'REMOVE_NODE',
        payload: { nodeId: 'node-1' },
      })
      return false
    })
    const interceptors: ActionInterceptor[] = [{ beforeAction }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, interceptors)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(beforeAction).toHaveBeenCalled()
    expect(engine.execute).not.toHaveBeenCalled()
  })

  it('sync before-action interceptor returning true allows delete', () => {
    const interceptors: ActionInterceptor[] = [{
      beforeAction: vi.fn(() => true),
    }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, interceptors)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalled()
  })

  it('async before-action interceptor cancels delete when promise resolves false', async () => {
    const interceptors: ActionInterceptor[] = [{
      beforeAction: vi.fn(() => Promise.resolve(false)),
    }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, interceptors)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    const result = del.handler(mockEvent())

    await result

    expect(engine.execute).not.toHaveBeenCalled()
  })

  it('async before-action interceptor allows delete when promise resolves true', async () => {
    const interceptors: ActionInterceptor[] = [{
      beforeAction: vi.fn(() => Promise.resolve(true)),
    }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, interceptors)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    const result = del.handler(mockEvent())

    await result

    expect(engine.execute).toHaveBeenCalled()
  })

  it('pending guard prevents concurrent async invocations', async () => {
    let resolveFirst!: (v: boolean) => void
    const beforeAction = vi.fn(() => new Promise<boolean>((resolve) => {
      resolveFirst = resolve
    }))
    const interceptors: ActionInterceptor[] = [{ beforeAction }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, interceptors)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!

    // First invocation starts async hook
    del.handler(mockEvent())

    // Second invocation while first is pending — should be no-op
    del.handler(mockEvent())

    expect(beforeAction).toHaveBeenCalledTimes(1)

    // Resolve the first
    resolveFirst(true)
    await new Promise(r => setTimeout(r, 0))

    expect(engine.execute).toHaveBeenCalledTimes(1)
  })

  it('fires after-action interceptor after successful delete', () => {
    const afterAction = vi.fn()
    const interceptors: ActionInterceptor[] = [{ afterAction }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, interceptors)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(afterAction).toHaveBeenCalledWith(expect.objectContaining({
      key: ActionKey.DELETE,
      risk: 'destructive',
      event: expect.anything(),
    }))
  })

  it('fires after-action interceptor after successful move', () => {
    const afterAction = vi.fn()
    const interceptors: ActionInterceptor[] = [{ afterAction }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, { index: 1 })

    const resolved = registry.resolve(ctx, interceptors)
    const moveUp = resolved.find(a => a.key === ActionKey.MOVE_UP)!
    moveUp.handler(mockEvent())

    expect(afterAction).toHaveBeenCalledWith(expect.objectContaining({
      key: ActionKey.MOVE_UP,
      risk: 'normal',
      action: {
        type: 'node.move',
        nodeId: 'node-1',
        destination: { kind: 'root', index: 0, sortScope: 'content' },
      },
      event: expect.anything(),
    }))
  })

  it('sync before-action interceptor returning false cancels move', () => {
    const interceptors: ActionInterceptor[] = [{
      beforeAction: vi.fn(invocation => invocation.key === ActionKey.MOVE_UP ? false : undefined),
    }]
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine, { index: 1 })

    const resolved = registry.resolve(ctx, interceptors)
    const moveUp = resolved.find(a => a.key === ActionKey.MOVE_UP)!
    moveUp.handler(mockEvent())

    expect(engine.execute).not.toHaveBeenCalled()
  })

  it('available: false renders action as disabled, not hidden', () => {
    const registry = createNodeActionRegistry()
    registry.register({
      key: 'test-action',
      label: 'Test',
      type: 'button',
      order: 500,
      available: () => false,
    })
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const action = resolved.find(a => a.key === 'test-action')

    expect(action).toBeDefined()
    expect(action!.disabled).toBe(true)
    expect(action!.visible).toBe(true)
  })

  it('available: false takes precedence over disabled: false', () => {
    const registry = createNodeActionRegistry()
    registry.register({
      key: 'test-action',
      label: 'Test',
      type: 'button',
      order: 500,
      available: () => false,
      disabled: () => false,
    })
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const action = resolved.find(a => a.key === 'test-action')

    expect(action).toBeDefined()
    expect(action!.disabled).toBe(true)
  })

  it('visible: false still hides action entirely', () => {
    const registry = createNodeActionRegistry()
    registry.register({
      key: 'test-action',
      label: 'Test',
      type: 'button',
      order: 500,
      visible: () => false,
    })
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    expect(resolved.find(a => a.key === 'test-action')).toBeUndefined()
  })

  it('actions without available predicate behave as before (default true)', () => {
    const registry = createNodeActionRegistry()
    registry.register({
      key: 'test-action',
      label: 'Test',
      type: 'button',
      order: 500,
      disabled: () => true,
    })
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const action = resolved.find(a => a.key === 'test-action')

    expect(action).toBeDefined()
    expect(action!.disabled).toBe(true)
  })

  it('custom actions run through action interceptors', () => {
    const beforeAction = vi.fn(() => false)
    const interceptors: ActionInterceptor[] = [{ beforeAction }]
    const customHandler = vi.fn()
    const registry = createNodeActionRegistry()
    registry.register({
      key: 'custom',
      label: 'Custom',
      type: 'button',
      order: 50,
      handler: customHandler,
    })

    const meta = makeMeta({ actions: { only: ['custom'] } })
    const ctx = makeCtx(engine, { siblingCount: 1, meta })

    const resolved = registry.resolve(ctx, interceptors)
    resolved[0].handler(mockEvent())

    expect(beforeAction).toHaveBeenCalledWith(expect.objectContaining({ key: 'custom' }))
    expect(customHandler).not.toHaveBeenCalled()
  })
})
