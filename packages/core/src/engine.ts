import type { CommandBusInstance } from './command-bus'
import type { EventHub } from './event-hub'
import type { HistoryManagerInstance } from './history-manager'
import type {
  Command,
  CommandHandler,
  DesignerSchema,
  EngineOptions,
  RegistryInstance,
  SchemaStoreInstance,
  WidgetMeta,
} from './types'
import { createCommandBus } from './command-bus'
import {
  addNodeHandler,
  moveNodeHandler,
  removeNodeHandler,
  setGlobalConfigHandler,
  updatePropsHandler,
} from './commands'
import { CommandType, DEFAULT_MAX_HISTORY_SIZE } from './constants'
import { createEventHub } from './event-hub'
import { createHistoryManager } from './history-manager'
import { createRegistry } from './registry'
import { createSchemaStore } from './schema-store'

export interface DesignerEngine {
  store: SchemaStoreInstance
  commandBus: CommandBusInstance
  history: HistoryManagerInstance
  registry: RegistryInstance
  eventHub: EventHub

  execute: <T = unknown>(command: Command<T>) => void
  registerHandler: <T = unknown>(type: string, handler: CommandHandler<T>) => void
  registerWidget: (meta: WidgetMeta) => void
  exportSchema: () => DesignerSchema
  importSchema: (schema: DesignerSchema) => void
  dispose: () => void
}

export function createEngine(options?: EngineOptions): DesignerEngine {
  const maxHistorySize = options?.maxHistorySize ?? DEFAULT_MAX_HISTORY_SIZE

  const store = createSchemaStore(options?.initialSchema)
  const eventHub = createEventHub()
  const registry = createRegistry()
  const history = createHistoryManager(store, eventHub, maxHistorySize)
  const commandBus = createCommandBus(store, registry, eventHub, history)

  commandBus.registerHandler(CommandType.ADD_NODE, addNodeHandler)
  commandBus.registerHandler(CommandType.MOVE_NODE, moveNodeHandler)
  commandBus.registerHandler(CommandType.REMOVE_NODE, removeNodeHandler)
  commandBus.registerHandler(CommandType.UPDATE_PROPS, updatePropsHandler)
  commandBus.registerHandler(CommandType.SET_GLOBAL_CONFIG, setGlobalConfigHandler)

  function execute<T = unknown>(command: Command<T>): void {
    commandBus.execute(command)
  }

  function registerHandler<T = unknown>(type: string, handler: CommandHandler<T>): void {
    commandBus.registerHandler(type, handler)
  }

  function registerWidget(meta: WidgetMeta): void {
    registry.registerWidget(meta)
  }

  function exportSchema(): DesignerSchema {
    return store.getSchema()
  }

  function importSchema(schema: DesignerSchema): void {
    store.setSchema(schema)
    history.clear()
  }

  function dispose(): void {
    eventHub.clear()
    history.clear()
  }

  return {
    store,
    commandBus,
    history,
    registry,
    eventHub,
    execute,
    registerHandler,
    registerWidget,
    exportSchema,
    importSchema,
    dispose,
  }
}
