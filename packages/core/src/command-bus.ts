import type { EventHub } from './event-hub'
import type { HistoryManagerInstance } from './history-manager'
import type {
  Command,
  CommandContext,
  CommandExecutionResult,
  CommandHandler,
  CommandResult,
  RegistryInstance,
  SchemaStoreInstance,
} from './types'
import { CommandType, EventName } from './constants'
import { pushOwnedHistorySnapshot } from './history-manager'
import { cloneSchemaRef } from './schema-utils'

const COMMAND_EVENT_MAP: Record<string, string> = {
  [CommandType.ADD_NODE]: EventName.NODE_ADDED,
  [CommandType.MOVE_NODE]: EventName.NODE_MOVED,
  [CommandType.REMOVE_NODE]: EventName.NODE_REMOVED,
  [CommandType.DUPLICATE_NODE]: EventName.NODE_DUPLICATED,
  [CommandType.CHANGE_CONTAINER_VARIANT]: EventName.CONTAINER_VARIANT_CHANGED,
  [CommandType.UPDATE_PROPS]: EventName.NODE_UPDATED,
  [CommandType.SET_GLOBAL_CONFIG]: EventName.GLOBAL_CONFIG_CHANGED,
}

export interface CommandBusInstance {
  execute: <T = unknown>(command: Command<T>) => CommandExecutionResult
  registerHandler: <T = unknown>(type: string, handler: CommandHandler<T>) => void
}

function normalizeHandlerResult(result: CommandResult): CommandExecutionResult {
  if (result === false)
    return { ok: false, code: 'COMMAND_REJECTED' }
  if (result)
    return result
  return { ok: true }
}

export function createCommandBus(
  store: SchemaStoreInstance,
  registry: RegistryInstance,
  eventHub: EventHub,
  history: HistoryManagerInstance,
): CommandBusInstance {
  const handlers = new Map<string, CommandHandler<any>>()
  let executing = false

  const ctx: CommandContext = { store, registry }

  function registerHandler<T = unknown>(
    type: string,
    handler: CommandHandler<T>,
  ): void {
    handlers.set(type, handler)
  }

  function execute<T = unknown>(command: Command<T>): CommandExecutionResult {
    if (executing)
      return { ok: false, code: 'COMMAND_REENTRANT' }
    executing = true

    try {
      const handler = handlers.get(command.type)
      if (!handler) {
        console.warn(`[dragcraft/core] No handler registered for command type: "${command.type}"`)
        return { ok: false, code: 'COMMAND_HANDLER_MISSING' }
      }

      const beforeSnapshot = cloneSchemaRef(store.schema)
      let result: CommandResult

      try {
        result = handler(ctx, command.payload)
      }
      catch (error) {
        store.setSchema(beforeSnapshot)
        console.error(`[dragcraft/core] Command "${command.type}" failed, rolling back:`, error)
        return {
          ok: false,
          code: 'COMMAND_HANDLER_FAILED',
          message: error instanceof Error ? error.message : String(error),
        }
      }

      const normalized = normalizeHandlerResult(result)
      if (!normalized.ok) {
        store.setSchema(beforeSnapshot)
        return normalized
      }

      pushOwnedHistorySnapshot(history, command.type, beforeSnapshot)
      store.triggerUpdate()

      const specificEvent = COMMAND_EVENT_MAP[command.type]
      if (specificEvent) {
        eventHub.emit(specificEvent, normalized.eventPayload ?? command.payload)
      }
      eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
      return normalized
    }
    finally {
      executing = false
    }
  }

  return {
    execute,
    registerHandler,
  }
}
