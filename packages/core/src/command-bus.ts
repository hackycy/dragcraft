import type { EventHub } from './event-hub'
import type { HistoryManagerInstance } from './history-manager'
import type {
  Command,
  CommandContext,
  CommandHandler,
  RegistryInstance,
  SchemaStoreInstance,
} from './types'
import { CommandType, EventName } from './constants'
import { cloneSchemaRef } from './schema-utils'

const COMMAND_EVENT_MAP: Record<string, string> = {
  [CommandType.ADD_NODE]: EventName.NODE_ADDED,
  [CommandType.MOVE_NODE]: EventName.NODE_MOVED,
  [CommandType.REMOVE_NODE]: EventName.NODE_REMOVED,
  [CommandType.UPDATE_PROPS]: EventName.NODE_UPDATED,
  [CommandType.SET_GLOBAL_CONFIG]: EventName.GLOBAL_CONFIG_CHANGED,
}

export interface CommandBusInstance {
  execute: <T = unknown>(command: Command<T>) => void
  registerHandler: <T = unknown>(type: string, handler: CommandHandler<T>) => void
}

export function createCommandBus(
  store: SchemaStoreInstance,
  registry: RegistryInstance,
  eventHub: EventHub,
  history: HistoryManagerInstance,
): CommandBusInstance {
  const handlers = new Map<string, CommandHandler<any>>()

  const ctx: CommandContext = { store, registry }

  function registerHandler<T = unknown>(
    type: string,
    handler: CommandHandler<T>,
  ): void {
    handlers.set(type, handler)
  }

  function execute<T = unknown>(command: Command<T>): void {
    const handler = handlers.get(command.type)
    if (!handler) {
      console.warn(`[dragcraft/core] No handler registered for command type: "${command.type}"`)
      return
    }

    const beforeSnapshot = cloneSchemaRef(store.schema)
    let result: false | void

    try {
      result = handler(ctx, command.payload)
    }
    catch (error) {
      store.setSchema(beforeSnapshot)
      console.error(`[dragcraft/core] Command "${command.type}" failed, rolling back:`, error)
      return
    }

    if (result === false) {
      store.setSchema(beforeSnapshot)
      return
    }

    history.pushSnapshot(command.type, beforeSnapshot)
    store.triggerUpdate()

    const specificEvent = COMMAND_EVENT_MAP[command.type]
    if (specificEvent) {
      eventHub.emit(specificEvent, command.payload)
    }
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
  }

  return {
    execute,
    registerHandler,
  }
}
