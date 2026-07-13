// ── Behavior utilities ──────────────────
export { resolveBehavior, resolveCreatable } from './behavior'

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
// ── Container material protocol ───────────
export { validateContainerDefinition } from './container-definition'
// ── Engine (main entry point) ─────────────
export { createEngine } from './engine'
export type { DesignerEngine } from './engine'
export { createEventHub, EventHub } from './event-hub'
export type { EventListener } from './event-hub'
// ── Helpers (tree utilities) ──────────────
export { findNodeById, findParentNode, insertNodeIntoTree, removeNodeFromTree, walkFlatChildren } from './helpers'
export { createHistoryManager } from './history-manager'
export type { HistoryManagerInstance, HistoryState } from './history-manager'

// ── Layout protocol ───────────────────────
export {
  createLayoutPlan,
  DEFAULT_LAYER,
  DEFAULT_LAYOUT_REGION,
  DEFAULT_SORT_SCOPE,
  getLayoutRegionEntries,
  getSortableArrayIndexForInsert,
  getSortScopeEntries,
  getSortScopeNodes,
  resolveNodeLayout,
} from './layout'

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
  CommandResult,
  ContainerDefinition,
  ContainerDefinitionValidationCode,
  ContainerDefinitionValidationError,
  ContainerDefinitionValidationResult,
  ContainerInitContext,
  ContainerPlacementContext,
  ContainerRegionConstraints,
  ContainerRegionDefinition,
  ContainerRegionId,
  ContainerState,
  ContainerVariantDefinition,
  ContainerVariantId,
  ContainerVariantMigrationContext,
  ContainerVariantMigrationResult,
  CoreWidgetActionConfig,
  CoreWidgetMeta,
  CreatableBehaviorPredicate,
  CreatableBehaviorResult,
  CreatableDecision,
  CreationBlockReason,
  DesignerSchema,
  DragTarget,
  EngineOptions,
  EngineState,
  FieldSchemaShape,
  FormSchemaShape,
  HistoryEntry,
  InstanceBehaviorContext,
  LayoutAnchor,
  LayoutAnchorSpec,
  LayoutAvoidTarget,
  LayoutChromePosition,
  LayoutEdge,
  LayoutInsetContribution,
  LayoutInsetPlan,
  LayoutLayerMode,
  LayoutNodeEntry,
  LayoutOffsets,
  LayoutPlacementKind,
  LayoutPlan,
  LayoutReserveMode,
  LayoutReserveSpec,
  MoveNodePayload,
  NodeLayout,
  NodePlacement,
  NodeStyle,
  PlacementDecision,
  RegistryInstance,
  RemoveNodePayload,
  ResolvedChromePlacement,
  ResolvedFlowPlacement,
  ResolvedLayerPlacement,
  ResolvedLayoutReserveSpec,
  ResolvedNodeLayout,
  ResolvedNodePlacement,
  SchemaMigration,
  SchemaNode,
  SchemaStoreInstance,
  SetGlobalConfigPayload,
  StyleValueMap,
  TypeBehaviorContext,
  UpdatePropsPayload,
  WidgetActionConfig,
  WidgetMeta,
} from './types'
