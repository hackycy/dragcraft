// ── Behavior utilities ──────────────────
export { resolveBehavior } from './behavior'

export { createCommandBus } from './command-bus'

export type { CommandBusInstance } from './command-bus'
// ── Built-in command handlers ─────────────
export {
  addNodeHandler,
  moveNodeHandler,
  removeNodeHandler,
  setGlobalConfigHandler,
  updatePropsHandler,
} from './commands'

// ── Constants ─────────────────────────────
export { CommandType, DEFAULT_MAX_HISTORY_SIZE, DEFAULT_SCHEMA_VERSION, EventName } from './constants'

export type { CommandTypeValue, EventNameValue } from './constants'
// ── Engine (main entry point) ─────────────
export { createEngine } from './engine'
export type { DesignerEngine } from './engine'
export { createEventHub, EventHub } from './event-hub'
export type { EventListener } from './event-hub'
// ── Helpers (tree utilities) ──────────────
export { findNodeById, findParentNode, insertNodeIntoTree, removeNodeFromTree, walkFlatChildren } from './helpers'
export { createHistoryManager } from './history-manager'
export type { HistoryManagerInstance } from './history-manager'

export { createRegistry } from './registry'

// ── Subsystem factories ───────────────────
export { createDefaultSchema, createSchemaStore } from './schema-store'

// ── Sortable constraints ─────────────────
export {
  findNearestValidIndex,
  getLockedIndices,
  getValidDropIndices,
  isInsertAllowed,
  isMoveAllowed,
  isRemoveAllowed,
} from './sortable'
// ── Types ─────────────────────────────────
export type {
  AddNodePayload,
  BehaviorPredicate,
  Command,
  CommandContext,
  CommandHandler,
  DesignerSchema,
  DragTarget,
  EngineOptions,
  HistoryEntry,
  InstanceBehaviorContext,
  MoveNodePayload,
  RegistryInstance,
  RemoveNodePayload,
  SchemaNode,
  SchemaStoreInstance,
  SetGlobalConfigPayload,
  TypeBehaviorContext,
  UpdatePropsPayload,
  WidgetActionConfig,
  WidgetMeta,
} from './types'
