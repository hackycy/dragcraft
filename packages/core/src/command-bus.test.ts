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

  it('execute rolls back schema when handler throws', () => {
    const { commandBus, store } = setup(
      makeSchema([{ id: 'a', type: 'text', props: { label: 'original' } }]),
    )
    const originalSchema = store.getSchema()

    commandBus.registerHandler('FAILING', () => {
      // Mutate the schema before throwing
      store.getRawSchema().root.children![0]!.props.label = 'mutated'
      throw new Error('handler failed')
    })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    commandBus.execute({ type: 'FAILING', payload: null })

    // Schema should be restored to pre-command state
    expect(store.getSchema()).toEqual(originalSchema)
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('rolling back'),
      expect.any(Error),
    )
    errorSpy.mockRestore()
  })

  it('execute cancels without history, update, or events when handler returns false', () => {
    const { commandBus, eventHub, history, store } = setup(
      makeSchema([{ id: 'a', type: 'text', props: { label: 'original' } }]),
    )
    const originalSchema = store.getSchema()
    const triggerUpdate = vi.spyOn(store, 'triggerUpdate')
    const schemaChanged = vi.fn()
    const nodeAdded = vi.fn()
    eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)
    eventHub.on(EventName.NODE_ADDED, nodeAdded)

    commandBus.registerHandler(CommandType.ADD_NODE, () => {
      store.getRawSchema().root.children![0]!.props.label = 'mutated'
      return false
    })

    commandBus.execute({ type: CommandType.ADD_NODE, payload: null })

    expect(store.getSchema()).toEqual(originalSchema)
    expect(history.canUndo()).toBe(false)
    expect(triggerUpdate).not.toHaveBeenCalled()
    expect(schemaChanged).not.toHaveBeenCalled()
    expect(nodeAdded).not.toHaveBeenCalled()
  })

  it('execute treats false as an unchanged command', () => {
    const { commandBus, eventHub, history, store } = setup(
      makeSchema([{ id: 'a', type: 'text', props: { label: 'original' } }]),
    )
    const triggerUpdate = vi.spyOn(store, 'triggerUpdate')
    const schemaChanged = vi.fn()
    eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    commandBus.registerHandler('NO_CHANGE', () => false)
    commandBus.execute({ type: 'NO_CHANGE', payload: null })

    expect(history.canUndo()).toBe(false)
    expect(triggerUpdate).not.toHaveBeenCalled()
    expect(schemaChanged).not.toHaveBeenCalled()
  })

  it('execute records void handlers as changed commands', () => {
    const { commandBus, eventHub, history, store } = setup()
    const triggerUpdate = vi.spyOn(store, 'triggerUpdate')
    const schemaChanged = vi.fn()
    eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    commandBus.registerHandler('CHANGED', () => {})
    commandBus.execute({ type: 'CHANGED', payload: null })

    expect(history.canUndo()).toBe(true)
    expect(triggerUpdate).toHaveBeenCalledTimes(1)
    expect(schemaChanged).toHaveBeenCalledTimes(1)
  })

  it('execute does not emit events when handler throws', () => {
    const { commandBus, eventHub } = setup()
    const schemaChanged = vi.fn()
    eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    commandBus.registerHandler('FAILING', () => {
      throw new Error('handler failed')
    })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    commandBus.execute({ type: 'FAILING', payload: null })

    expect(schemaChanged).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
