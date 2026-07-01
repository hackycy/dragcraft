import type { CommandBusInstance } from './command-bus'
import type { EventHub } from './event-hub'
import type { HistoryManagerInstance } from './history-manager'
import type {
  Command,
  CommandHandler,
  DesignerSchema,
  EngineOptions,
  RegistryInstance,
  SchemaMigration,
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
import { CommandType, DEFAULT_MAX_HISTORY_SIZE, EventName } from './constants'
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
  registerMigration: (migration: SchemaMigration) => void
  migrateSchema: (schema: DesignerSchema) => DesignerSchema
  exportSchema: () => DesignerSchema
  importSchema: (schema: DesignerSchema) => void
  dispose: () => void
}

export function createEngine(options?: EngineOptions): DesignerEngine {
  const maxHistorySize = options?.maxHistorySize ?? DEFAULT_MAX_HISTORY_SIZE

  const eventHub = createEventHub()
  const store = createSchemaStore(options?.initialSchema, (id) => {
    eventHub.emit(EventName.SELECTION_CHANGED, id)
  })
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

  const migrations: SchemaMigration[] = []

  function registerMigration(migration: SchemaMigration): void {
    migrations.push(migration)
  }

  function migrateSchema(schema: DesignerSchema): DesignerSchema {
    let current = schema
    // Apply migrations sequentially until no more apply
    const applied = new Set<string>()
    let changed = true
    while (changed) {
      changed = false
      for (const m of migrations) {
        const key = `${m.fromVersion}->${m.toVersion}`
        if (current.version === m.fromVersion && !applied.has(key)) {
          current = m.migrate(current)
          applied.add(key)
          changed = true
        }
      }
    }
    return current
  }

  function exportSchema(): DesignerSchema {
    return store.getSchema()
  }

  function importSchema(schema: DesignerSchema): void {
    if (!schema?.root || !schema.version) {
      console.warn('[dragcraft/core] importSchema: invalid schema, missing root or version')
      return
    }
    const migrated = migrateSchema(schema)
    store.setSchema(migrated)
    history.clear()
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
  }

  function dispose(): void {
    eventHub.clear()
    history.clear()
    store.selectNode(null)
    store.hoverNode(null)
    store.setDragTarget(null)
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
    registerMigration,
    migrateSchema,
    exportSchema,
    importSchema,
    dispose,
  }
}
