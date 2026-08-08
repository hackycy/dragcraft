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
import { readonly } from 'vue'
import { CommandType, EventName } from './constants'
import { pushOwnedHistorySnapshot } from './history-manager'
import { cloneSchema } from './schema-utils'

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
  if (!result)
    return { ok: true, changed: true }
  if (!result.ok)
    return result
  return { ...result, changed: result.changed ?? true }
}

export function createCommandBus(
  store: SchemaStoreInstance,
  registry: RegistryInstance,
  eventHub: EventHub,
  history: HistoryManagerInstance,
): CommandBusInstance {
  const handlers = new Map<string, CommandHandler<any>>()
  let executing = false

  const interactionStore = {
    selectedNodeId: readonly(store.selectedNodeId),
    hoveredNodeId: readonly(store.hoveredNodeId),
    selectNode: store.selectNode,
    hoverNode: store.hoverNode,
  }

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

      const beforeSnapshot = store.getSnapshot()
      const draft = cloneSchema(beforeSnapshot)
      const ctx: CommandContext = {
        schema: beforeSnapshot,
        draft,
        store: interactionStore,
        registry,
      }
      let result: CommandResult

      try {
        result = handler(ctx, command.payload)
      }
      catch (error) {
        console.error(`[dragcraft/core] Command "${command.type}" failed, discarding draft:`, error)
        return {
          ok: false,
          code: 'COMMAND_HANDLER_FAILED',
          message: error instanceof Error ? error.message : String(error),
        }
      }

      const normalized = normalizeHandlerResult(result)
      if (!normalized.ok)
        return normalized
      if (!normalized.changed)
        return normalized

      const snapshot = store.commitSchema(draft)
      pushOwnedHistorySnapshot(history, command.type, beforeSnapshot)

      const specificEvent = COMMAND_EVENT_MAP[command.type]
      if (specificEvent) {
        eventHub.emit(specificEvent, normalized.eventPayload ?? command.payload)
      }
      eventHub.emit(EventName.SCHEMA_CHANGED, snapshot)
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
