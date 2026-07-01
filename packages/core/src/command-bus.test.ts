import type { CommandHandler, DesignerSchema, SchemaNode } from './types'
import { describe, expect, it, vi } from 'vitest'
import { createCommandBus } from './command-bus'
import { CommandType, EventName } from './constants'
import { EventHub } from './event-hub'
import { createHistoryManager } from './history-manager'
import { createRegistry } from './registry'
import { createSchemaStore } from './schema-store'

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function setup(initial?: DesignerSchema) {
  const store = createSchemaStore(initial ?? makeSchema())
  const eventHub = new EventHub()
  const registry = createRegistry()
  const history = createHistoryManager(store, eventHub)
  const commandBus = createCommandBus(store, registry, eventHub, history)
  return { store, eventHub, registry, history, commandBus }
}

describe('createCommandBus', () => {
  it('execute calls registered handler', () => {
    const { commandBus } = setup()
    const handler: CommandHandler = vi.fn()
    commandBus.registerHandler('CUSTOM', handler)
    commandBus.execute({ type: 'CUSTOM', payload: { x: 1 } })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ store: expect.any(Object), registry: expect.any(Object) }),
      { x: 1 },
    )
  })

  it('execute warns when no handler registered', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { commandBus } = setup()
    commandBus.execute({ type: 'UNKNOWN', payload: null })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No handler registered'))
    warn.mockRestore()
  })

  it('execute pushes snapshot to history', () => {
    const { commandBus, history } = setup()
    commandBus.registerHandler('TEST', () => {})
    commandBus.execute({ type: 'TEST', payload: null })
    expect(history.canUndo()).toBe(true)
  })

  it('execute calls store.triggerUpdate', () => {
    const { commandBus, store } = setup()
    const spy = vi.spyOn(store, 'triggerUpdate')
    commandBus.registerHandler('TEST', () => {})
    commandBus.execute({ type: 'TEST', payload: null })
    expect(spy).toHaveBeenCalled()
  })

  it('emit specific event for built-in command types', () => {
    const { commandBus, eventHub } = setup()
    const listener = vi.fn()
    eventHub.on(EventName.NODE_ADDED, listener)
    commandBus.registerHandler(CommandType.ADD_NODE, () => {})
    commandBus.execute({ type: CommandType.ADD_NODE, payload: {} })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('always emits SCHEMA_CHANGED', () => {
    const { commandBus, eventHub } = setup()
    const listener = vi.fn()
    eventHub.on(EventName.SCHEMA_CHANGED, listener)
    commandBus.registerHandler('CUSTOM', () => {})
    commandBus.execute({ type: 'CUSTOM', payload: null })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('custom command type does not emit specific event', () => {
    const { commandBus, eventHub } = setup()
    const nodeAdded = vi.fn()
    const schemaChanged = vi.fn()
    eventHub.on(EventName.NODE_ADDED, nodeAdded)
    eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)
    commandBus.registerHandler('CUSTOM', () => {})
    commandBus.execute({ type: 'CUSTOM', payload: null })
    expect(nodeAdded).not.toHaveBeenCalled()
    expect(schemaChanged).toHaveBeenCalledTimes(1)
  })

  it('registerHandler overwrites previous handler', () => {
    const { commandBus } = setup()
    const a = vi.fn()
    const b = vi.fn()
    commandBus.registerHandler('X', a)
    commandBus.registerHandler('X', b)
    commandBus.execute({ type: 'X', payload: null })
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledTimes(1)
  })
})
