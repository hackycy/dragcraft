import type { DesignerEngine, DesignerSchema, SchemaNode } from '@dragcraft/core'
import type { NodeActionContext } from './action-registry'
import type { ActionInterceptor } from './action-runtime'
import type { RendererWidgetMeta } from './types'
import { getLockedIndices, isMoveAllowed, resolveBehavior } from '@dragcraft/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    resolveBehavior: vi.fn((_field: unknown, _ctx: unknown) => true),
    getLockedIndices: vi.fn(() => new Set<number>()),
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
      getRawSchema: () => schema,
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
  return {
    node: makeNode(),
    owner: { kind: 'root', sortScope: 'content' },
    index: 0,
    siblingCount: 3,
    sortScope: 'content',
    meta: makeMeta(),
    engine,
    ...overrides,
  }
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
  afterEach(() => {
    vi.mocked(resolveBehavior).mockReturnValue(true)
  })

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

  it('built-in actions have available predicate instead of visible for capability checks', async () => {
    const { resolveBehavior } = await import('@dragcraft/core')
    vi.mocked(resolveBehavior).mockReturnValue(false)

    const actions = createDefaultActions()
    const dragAction = actions.find(a => a.key === ActionKey.DRAG)!
    const moveUpAction = actions.find(a => a.key === ActionKey.MOVE_UP)!
    const deleteAction = actions.find(a => a.key === ActionKey.DELETE)!

    // visible should always be true (or undefined) — actions conceptually apply
    expect(dragAction.visible).toBeUndefined()
    expect(moveUpAction.visible).toBeUndefined()
    expect(deleteAction.visible).toBeUndefined()

    // available should check capability
    const ctx = makeCtx(makeEngine(), { node: { id: 'n', type: 't', props: {} }, siblingCount: 1 })
    expect(dragAction.available!(ctx as any)).toBe(false)
    expect(moveUpAction.available!(ctx as any)).toBe(false)
    expect(deleteAction.available!(ctx as any)).toBe(false)
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
    vi.mocked(isMoveAllowed).mockReset().mockReturnValue(true)
  })

  afterEach(() => {
    vi.mocked(resolveBehavior).mockReturnValue(true)
  })

  it('returns visible actions for a basic node', () => {
    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    // All 5 default actions visible by default (resolveBehavior mocked to return true)
    expect(resolved).toHaveLength(5)
    expect(resolved.every(a => a.visible)).toBe(true)
  })

  it('renders actions as disabled when available returns false', async () => {
    vi.mocked(resolveBehavior).mockReturnValue(false) // all capabilities unavailable

    const registry = createNodeActionRegistry()
    const ctx = makeCtx(engine)

    const resolved = registry.resolve(ctx, emptyInterceptors)
    const drag = resolved.find(a => a.key === ActionKey.DRAG)
    expect(drag).toBeDefined()
    expect(drag!.disabled).toBe(true)
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
    engine.state.getSchema().root.children = [makeNode({ id: 'root-lock', type: 'locked' })]
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
      command: {
        type: 'MOVE_NODE',
        payload: {
          nodeId: 'node-1',
          destination: { kind: 'root', index: 0, sortScope: 'content' },
        },
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
