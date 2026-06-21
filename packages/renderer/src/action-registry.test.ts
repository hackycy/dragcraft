import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { RendererEventHooks } from './event-hooks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActionKey, createDefaultActions, createNodeActionRegistry } from './action-registry'

// Minimal MouseEvent stub for Node environment
function mockEvent(): MouseEvent {
  return { stopPropagation: vi.fn(), type: 'click' } as unknown as MouseEvent
}

// Mock @dragcraft/core
vi.mock('@dragcraft/core', () => ({
  CommandType: {
    MOVE_NODE: 'MOVE_NODE',
    REMOVE_NODE: 'REMOVE_NODE',
  },
  resolveBehavior: vi.fn((_field: unknown, _ctx: unknown) => true),
  getLockedIndices: vi.fn(() => new Set<number>()),
  isMoveAllowed: vi.fn(() => true),
  isRemoveAllowed: vi.fn(() => true),
}))

function makeNode(overrides?: Partial<SchemaNode>): SchemaNode {
  return {
    id: 'node-1',
    type: 'button',
    props: {},
    ...overrides,
  }
}

function makeEngine(overrides?: Partial<DesignerEngine>): DesignerEngine {
  return {
    store: {
      schema: { value: { version: '1', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children: [] } } },
      getRawSchema: () => ({ version: '1', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children: [] } }),
    } as unknown as DesignerEngine['store'],
    registry: {
      getWidget: vi.fn(() => undefined),
    } as unknown as DesignerEngine['registry'],
    execute: vi.fn(),
    ...overrides,
  } as DesignerEngine
}

function makeMeta(overrides?: Partial<WidgetMeta>): WidgetMeta {
  return {
    type: 'button',
    title: 'Button',
    group: 'basic',
    defaultProps: {},
    formSchema: {},
    ...overrides,
  } as WidgetMeta
}

describe('createDefaultActions', () => {
  it('returns 4 built-in actions sorted by order', () => {
    const actions = createDefaultActions()
    expect(actions).toHaveLength(4)
    expect(actions.map(a => a.key)).toEqual([
      ActionKey.DRAG,
      ActionKey.MOVE_UP,
      ActionKey.MOVE_DOWN,
      ActionKey.DELETE,
    ])
    expect(actions.map(a => a.order)).toEqual([100, 200, 300, 400])
  })
})

describe('createNodeActionRegistry', () => {
  it('registers default actions on creation', () => {
    const registry = createNodeActionRegistry()
    expect(registry.getActions()).toHaveLength(4)
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
    expect(registry.getActions()).toHaveLength(5)
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
  let emptyHooks: RendererEventHooks

  beforeEach(() => {
    engine = makeEngine()
    emptyHooks = {}
  })

  it('returns visible actions for a basic node', () => {
    const registry = createNodeActionRegistry()
    const ctx = {
      node: makeNode(),
      index: 0,
      siblingCount: 3,
      meta: makeMeta(),
      engine,
    }

    const resolved = registry.resolve(ctx, emptyHooks)
    // All 4 default actions visible by default (resolveBehavior mocked to return true)
    expect(resolved).toHaveLength(4)
    expect(resolved.every(a => a.visible)).toBe(true)
  })

  it('filters out invisible actions', async () => {
    const { resolveBehavior } = await import('@dragcraft/core')
    vi.mocked(resolveBehavior).mockReturnValueOnce(false) // drag not visible

    const registry = createNodeActionRegistry()
    const ctx = {
      node: makeNode(),
      index: 0,
      siblingCount: 3,
      meta: makeMeta(),
      engine,
    }

    const resolved = registry.resolve(ctx, emptyHooks)
    expect(resolved.find(a => a.key === ActionKey.DRAG)).toBeUndefined()
  })

  it('applies widgetActions.only filter', () => {
    const registry = createNodeActionRegistry()
    const meta = makeMeta({ actions: { only: [ActionKey.DELETE] } })
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta, engine }

    const resolved = registry.resolve(ctx, emptyHooks)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].key).toBe(ActionKey.DELETE)
  })

  it('applies widgetActions.exclude filter', () => {
    const registry = createNodeActionRegistry()
    const meta = makeMeta({ actions: { exclude: [ActionKey.DRAG, ActionKey.MOVE_UP, ActionKey.MOVE_DOWN] } })
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta, engine }

    const resolved = registry.resolve(ctx, emptyHooks)
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
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta, engine }

    const resolved = registry.resolve(ctx, emptyHooks)
    expect(resolved).toHaveLength(5)
    expect(resolved[0].key).toBe('custom') // order 50 comes first
  })

  it('move-up handler calls engine.execute with correct payload', () => {
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 1, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, emptyHooks)
    const moveUp = resolved.find(a => a.key === ActionKey.MOVE_UP)!
    moveUp.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalledWith({
      type: 'MOVE_NODE',
      payload: { nodeId: 'node-1', index: 0 },
    })
  })

  it('move-down handler calls engine.execute with correct payload', () => {
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 1, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, emptyHooks)
    const moveDown = resolved.find(a => a.key === ActionKey.MOVE_DOWN)!
    moveDown.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalledWith({
      type: 'MOVE_NODE',
      payload: { nodeId: 'node-1', index: 2 },
    })
  })

  it('delete handler calls engine.execute with correct payload', () => {
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, emptyHooks)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalledWith({
      type: 'REMOVE_NODE',
      payload: { nodeId: 'node-1' },
    })
  })

  it('sync before hook returning false cancels delete', () => {
    const hooks: RendererEventHooks = {
      onBeforeDelete: vi.fn(() => false),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(hooks.onBeforeDelete).toHaveBeenCalled()
    expect(engine.execute).not.toHaveBeenCalled()
  })

  it('sync before hook returning true allows delete', () => {
    const hooks: RendererEventHooks = {
      onBeforeDelete: vi.fn(() => true),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(engine.execute).toHaveBeenCalled()
  })

  it('async before hook cancels delete when promise resolves false', async () => {
    const hooks: RendererEventHooks = {
      onBeforeDelete: vi.fn(() => Promise.resolve(false)),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    const result = del.handler(mockEvent())

    await result

    expect(engine.execute).not.toHaveBeenCalled()
  })

  it('async before hook allows delete when promise resolves true', async () => {
    const hooks: RendererEventHooks = {
      onBeforeDelete: vi.fn(() => Promise.resolve(true)),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    const result = del.handler(mockEvent())

    await result

    expect(engine.execute).toHaveBeenCalled()
  })

  it('pending guard prevents concurrent async invocations', async () => {
    let resolveFirst!: (v: boolean) => void
    const hooks: RendererEventHooks = {
      onBeforeDelete: vi.fn(() => new Promise<boolean>((r) => { resolveFirst = r })),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!

    // First invocation starts async hook
    del.handler(mockEvent())

    // Second invocation while first is pending — should be no-op
    del.handler(mockEvent())

    expect(hooks.onBeforeDelete).toHaveBeenCalledTimes(1)

    // Resolve the first
    resolveFirst(true)
    await new Promise(r => setTimeout(r, 0))

    expect(engine.execute).toHaveBeenCalledTimes(1)
  })

  it('fires onAfterDelete hook after successful delete', () => {
    const hooks: RendererEventHooks = {
      onAfterDelete: vi.fn(),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const del = resolved.find(a => a.key === ActionKey.DELETE)!
    del.handler(mockEvent())

    expect(hooks.onAfterDelete).toHaveBeenCalledWith({
      nodeId: 'node-1',
      event: expect.anything(),
    })
  })

  it('fires onAfterMove hook after successful move', () => {
    const hooks: RendererEventHooks = {
      onAfterMove: vi.fn(),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 1, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const moveUp = resolved.find(a => a.key === ActionKey.MOVE_UP)!
    moveUp.handler(mockEvent())

    expect(hooks.onAfterMove).toHaveBeenCalledWith({
      nodeId: 'node-1',
      direction: 'up',
      fromIndex: 1,
      toIndex: 0,
      event: expect.anything(),
    })
  })

  it('sync before hook returning false cancels move', () => {
    const hooks: RendererEventHooks = {
      onBeforeMove: vi.fn(() => false),
    }
    const registry = createNodeActionRegistry()
    const ctx = { node: makeNode(), index: 1, siblingCount: 3, meta: makeMeta(), engine }

    const resolved = registry.resolve(ctx, hooks)
    const moveUp = resolved.find(a => a.key === ActionKey.MOVE_UP)!
    moveUp.handler(mockEvent())

    expect(engine.execute).not.toHaveBeenCalled()
  })

  it('custom actions bypass event hooks', () => {
    const hooks: RendererEventHooks = {
      onBeforeDelete: vi.fn(() => false),
    }
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
    const ctx = { node: makeNode(), index: 0, siblingCount: 1, meta, engine }

    const resolved = registry.resolve(ctx, hooks)
    resolved[0].handler(mockEvent())

    expect(customHandler).toHaveBeenCalled()
  })
})
