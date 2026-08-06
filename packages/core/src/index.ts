export {
  isSchemaManagedWidget,
  isWidgetVisibleInMaterialPanel,
  resolveAuthoringCapability,
  resolveAuthoringPolicy,
  resolveWidgetCreation,
  validateAuthoringTransition,
  validateSubtreeCreation,
  validateSubtreeDeletion,
} from './authoring-policy'

// ── Behavior utilities ──────────────────
export { resolveBehavior, resolveCreatable } from './behavior'

export { createCommandBus } from './command-bus'

export type { CommandBusInstance } from './command-bus'
// ── Built-in command handlers ─────────────
export {
  addNodeHandler,
  changeContainerVariantHandler,
  duplicateNodeHandler,
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
export {
  createContainerState,
  createRegisteredNode,
  resolvePlacementDecision,
} from './container-placement'
export { createContainerPlan } from './container-plan'
export type {
  ContainerDeclaration,
  RegionDeclaration,
  SchemaDefinitionSnapshot,
  SchemaTypeDeclaration,
} from './definitions/types'
export { cloneJsonValue, collectInvalidJsonPaths } from './document/json'
export type {
  ContainerStructure as DocumentContainerStructure,
  DeepReadonly as DocumentDeepReadonly,
  DocumentSchema,
  DocumentStructure,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  NodeDefinition,
  NodeId,
  NodeType,
  PageDefinition,
  RegionId,
} from './document/types'

export { applySchemaOperation } from './editor/apply-schema-operation'
export type { SchemaEditResult } from './editor/apply-schema-operation'
export type { NodeBundle } from './editor/node-bundle'
export type { OperationBatch, SchemaOperation } from './editor/schema-operation'

export type { StructuralDestination } from './editor/structural-destination'

// ── Engine (main entry point) ─────────────
export { createEngine } from './engine'
export type { DesignerEngine, SchemaImportResult } from './engine'
export { createEventHub, EventHub } from './event-hub'
export type { EventListener } from './event-hub'
// ── Helpers (tree utilities) ──────────────
export { cloneNodeSubtree, collectSubtreeIds, findNodeById, findParentNode, insertNodeIntoTree, removeNodeFromTree, walkFlatChildren } from './helpers'
export { createHistoryManager } from './history-manager'
export type { HistoryManagerInstance, HistoryState } from './history-manager'

// ── Layout protocol ───────────────────────
export {
  clampInsertIndex,
  createLayoutPlan,
  DEFAULT_LAYER,
  DEFAULT_LAYOUT_REGION,
  DEFAULT_SORT_SCOPE,
  getLayoutRegionEntries,
  getSortableArrayIndexForInsert,
  getSortScopeEntries,
  getSortScopeNodes,
  resolveDestination,
  resolveNodeLayout,
  resolveNodeSource,
  stripPageLayout,
} from './layout'

export { createRegistry } from './registry'
export type { DiagnosticReport } from './resolver/diagnostics'
export { resolveSchema } from './resolver/resolve-schema'

export type { ResolveSchemaOptions, SchemaResolution } from './resolver/resolve-schema'

export type { ResolvedDocument } from './resolver/resolved-document'

// ── Schema ownership ─────────────────────
export { buildSchemaIndex, findIndexedNode } from './schema-index'
// ── Subsystem factories ───────────────────
export { createDefaultSchema } from './schema-store'

export { validateSchema } from './schema-validation'
// ── Sortable constraints ─────────────────
export {
  findNearestValidIndex,
  getLockedIndices,
  getLockedIndicesFromNodes,
  getValidDropIndices,
  isInsertAllowed,
  isMoveAllowed,
  isRemoveAllowed,
} from './sortable'

export { normalizeStyleValueMap } from './style'
// ── Types ─────────────────────────────────
export { commandFailure } from './types'
export type {
  AddNodePayload,
  BehaviorPredicate,
  ChangeContainerVariantPayload,
  Command,
  CommandContext,
  CommandExecutionResult,
  CommandHandler,
  CommandResult,
  ContainerDefinition,
  ContainerDefinitionValidationCode,
  ContainerDefinitionValidationError,
  ContainerDefinitionValidationResult,
  ContainerInitContext,
  ContainerPlacementContext,
  ContainerPlan,
  ContainerPlanRegion,
  ContainerPlanResult,
  ContainerRegionConstraints,
  ContainerRegionDefinition,
  ContainerRegionId,
  ContainerState,
  ContainerStateCreationResult,
  ContainerVariantDefinition,
  ContainerVariantId,
  ContainerVariantMigrationContext,
  ContainerVariantMigrationResult,
  CoreWidgetActionConfig,
  CoreWidgetMeta,
  CreatableBehaviorPredicate,
  CreatableBehaviorResult,
  CreatableDecision,
  CreateRegisteredNode,
  CreationBlockReason,
  DeepReadonly,
  DesignerSchema,
  DragTarget,
  DuplicateNodePayload,
  EngineOptions,
  EngineState,
  EngineStore,
  FieldSchemaShape,
  FormSchemaShape,
  HistoryEntry,
  IndexedNodeLocation,
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
  NodeDestination,
  NodeLayout,
  NodeOwner,
  NodePlacement,
  NodeStyle,
  OwnerResolutionResult,
  PlacementDecision,
  RegistryInstance,
  RemoveNodePayload,
  ResolvedAuthoringPolicy,
  ResolvedChromePlacement,
  ResolvedFlowPlacement,
  ResolvedLayerPlacement,
  ResolvedLayoutReserveSpec,
  ResolvedNodeDestination,
  ResolvedNodeLayout,
  ResolvedNodePlacement,
  ResolvedNodeSource,
  ResolvePlacementContext,
  SchemaDiagnostic,
  SchemaDiagnosticSeverity,
  SchemaIndexResult,
  SchemaMigration,
  SchemaNode,
  SchemaValidationResult,
  SetGlobalConfigPayload,
  StyleValueMap,
  TypeBehaviorContext,
  UpdatePropsPayload,
  WidgetActionConfig,
  WidgetMeta,
} from './types'
