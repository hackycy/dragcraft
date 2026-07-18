import type { CommandBusInstance } from './command-bus'
import type { EventHub } from './event-hub'
import type { HistoryManagerInstance } from './history-manager'
import type {
  Command,
  CommandExecutionResult,
  CommandHandler,
  DesignerSchema,
  EngineOptions,
  EngineState,
  RegistryInstance,
  SchemaDiagnostic,
  SchemaMigration,
  SchemaStoreInstance,
  WidgetMeta,
} from './types'
import { createCommandBus } from './command-bus'
import {
  addNodeHandler,
  changeContainerVariantHandler,
  duplicateNodeHandler,
  moveNodeHandler,
  removeNodeHandler,
  setGlobalConfigHandler,
  updatePropsHandler,
} from './commands'
import { CommandType, DEFAULT_MAX_HISTORY_SIZE, EventName } from './constants'
import { createEventHub } from './event-hub'
import { findNodeById } from './helpers'
import { createHistoryManager } from './history-manager'
import { createRegistry } from './registry'
import { createSchemaStore } from './schema-store'
import { cloneSchema } from './schema-utils'
import { collectSchemaStructuralDiagnostics, validateSchema } from './schema-validation'

export type SchemaImportResult
  = | { ok: true, diagnostics: SchemaDiagnostic[] }
    | { ok: false, diagnostics: SchemaDiagnostic[] }

export interface DesignerEngine {
  store: SchemaStoreInstance
  state: EngineState
  commandBus: CommandBusInstance
  history: HistoryManagerInstance
  registry: RegistryInstance
  eventHub: EventHub

  execute: <T = unknown>(command: Command<T>) => CommandExecutionResult
  registerHandler: <T = unknown>(type: string, handler: CommandHandler<T>) => void
  registerWidget: (meta: WidgetMeta) => void
  registerMigration: (migration: SchemaMigration) => void
  migrateSchema: (schema: DesignerSchema) => DesignerSchema
  exportSchema: () => DesignerSchema
  importSchema: (schema: DesignerSchema) => SchemaImportResult
  dispose: () => void
}

export function createEngine(options?: EngineOptions): DesignerEngine {
  const maxHistorySize = options?.maxHistorySize ?? DEFAULT_MAX_HISTORY_SIZE

  const eventHub = createEventHub()
  const store = createSchemaStore(undefined, (id) => {
    eventHub.emit(EventName.SELECTION_CHANGED, id)
  })
  const registry = createRegistry()
  const history = createHistoryManager(store, eventHub, maxHistorySize)
  const commandBus = createCommandBus(store, registry, eventHub, history)
  const state: EngineState = {
    getSchema: () => store.getSchema(),
    getNodeById: (id) => {
      const schema = store.getSchema()
      return findNodeById(schema.root, id)
    },
    getSelectedNodeId: () => store.selectedNodeId.value,
    getHoveredNodeId: () => store.hoveredNodeId.value,
    getDragTarget: () => {
      const target = store.dragTarget.value
      return target ? { ...target } : null
    },
  }

  commandBus.registerHandler(CommandType.ADD_NODE, addNodeHandler)
  commandBus.registerHandler(CommandType.CHANGE_CONTAINER_VARIANT, changeContainerVariantHandler)
  commandBus.registerHandler(CommandType.DUPLICATE_NODE, duplicateNodeHandler)
  commandBus.registerHandler(CommandType.MOVE_NODE, moveNodeHandler)
  commandBus.registerHandler(CommandType.REMOVE_NODE, removeNodeHandler)
  commandBus.registerHandler(CommandType.UPDATE_PROPS, updatePropsHandler)
  commandBus.registerHandler(CommandType.SET_GLOBAL_CONFIG, setGlobalConfigHandler)

  function execute<T = unknown>(command: Command<T>): CommandExecutionResult {
    return commandBus.execute(command)
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

  function importSchema(schema: DesignerSchema): SchemaImportResult {
    const structuralDiagnostics = collectSchemaStructuralDiagnostics(schema)
    if (structuralDiagnostics.length > 0) {
      console.warn('[dragcraft/core] importSchema: invalid schema, missing root or version')
      return {
        ok: false,
        diagnostics: structuralDiagnostics,
      }
    }
    const migrated = migrateSchema(cloneSchema(schema))
    const validation = validateSchema(migrated, registry)
    if (!validation.valid)
      return { ok: false, diagnostics: validation.diagnostics }

    store.setSchema(validation.schema)
    history.clear()
    eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
    return { ok: true, diagnostics: validation.diagnostics }
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
    state,
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
