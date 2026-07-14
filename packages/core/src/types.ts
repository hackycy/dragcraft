import type { Ref, ShallowRef } from 'vue'

// ──────────────────────────────────────────
// Node types
// ──────────────────────────────────────────

export interface SchemaNode {
  id: string
  type: string
  props: Record<string, unknown>
  style?: NodeStyle
  layout?: NodeLayout
  container?: ContainerState
  /** Only used on the root node to hold the flat widget list */
  children?: SchemaNode[]
}

export type StyleValueMap = Record<string, unknown>

export interface NodeStyle {
  /** Styles applied to the node's layout box in its assigned surface. */
  container?: StyleValueMap
  /** Styles applied to the rendered widget component. */
  content?: StyleValueMap
  /** Styles applied to a page or container surface owned by this node. */
  surface?: StyleValueMap
}

// ──────────────────────────────────────────
// Document schema
// ──────────────────────────────────────────

export interface DesignerSchema {
  version: string
  globalConfig: Record<string, unknown>
  root: SchemaNode
}

export type SchemaDiagnosticSeverity = 'warning' | 'error'

export interface SchemaDiagnostic {
  code: string
  severity: SchemaDiagnosticSeverity
  nodeId?: string
  ownerId?: string
  regionId?: string
  path?: string
  details?: Record<string, unknown>
}

export interface IndexedNodeLocation {
  node: SchemaNode
  owner: 'root' | string
  regionId?: string
  index: number
  depth: 1 | 2
}

export interface SchemaIndexResult {
  index: Map<string, IndexedNodeLocation>
  diagnostics: SchemaDiagnostic[]
}

export type NodeOwner
  = | { kind: 'root', sortScope?: string }
    | { kind: 'container', containerId: string, regionId: string }

export type NodeDestination
  = | ({ kind: 'root', sortScope?: string } & { index?: number })
    | ({ kind: 'container', containerId: string, regionId: string } & { index?: number })

export interface ResolvedNodeSource {
  location: IndexedNodeLocation
  children: SchemaNode[]
  index: number
  destination: NodeDestination
}

export interface ResolvedNodeDestination {
  children: SchemaNode[]
  destination: NodeDestination
  container?: SchemaNode
  definition?: ContainerDefinition
  variant?: ContainerVariantDefinition
  region?: ContainerRegionDefinition
}

export type OwnerResolutionResult<T>
  = | { ok: true, value: T }
    | { ok: false, code: string, message?: string }

export interface SchemaValidationResult {
  valid: boolean
  schema: DesignerSchema
  diagnostics: SchemaDiagnostic[]
}

// ──────────────────────────────────────────
// Layout protocol
// ──────────────────────────────────────────

export interface NodeLayout {
  placement?: NodePlacement
  order?: number
  visible?: boolean | ((ctx: { node: SchemaNode, schema: DesignerSchema }) => boolean)
}

export interface ResolvedNodeLayout {
  placement: ResolvedNodePlacement
  region?: string
  sortScope: string | false
  order?: number
  visible: boolean
}

export interface LayoutNodeEntry {
  node: SchemaNode
  arrayIndex: number
  layout: ResolvedNodeLayout
}

export interface LayoutPlan {
  entries: LayoutNodeEntry[]
  regions: Map<string, LayoutNodeEntry[]>
  chrome: LayoutNodeEntry[]
  layers: Map<string, LayoutNodeEntry[]>
  sortScopes: Map<string, LayoutNodeEntry[]>
  insets: LayoutInsetPlan
}

export type LayoutPlacementKind = 'flow' | 'chrome' | 'layer'
export type LayoutEdge = 'block-start' | 'block-end' | 'inline-start' | 'inline-end'
export type LayoutAnchor = 'start' | 'center' | 'end'
export type LayoutChromePosition = 'fixed' | 'sticky' | 'flow'
export type LayoutLayerMode = 'framework' | 'self'
export type LayoutReserveMode = 'measure' | 'size' | 'none'
export type LayoutAvoidTarget = 'safe-area' | 'chrome' | 'viewport'

export interface LayoutAnchorSpec {
  anchor: { block?: LayoutAnchor, inline?: LayoutAnchor }
}

export interface LayoutOffsets {
  blockStart?: string | number
  blockEnd?: string | number
  inlineStart?: string | number
  inlineEnd?: string | number
}

export interface LayoutReserveSpec {
  mode?: LayoutReserveMode
  size?: string | number
}

export interface ResolvedLayoutReserveSpec {
  mode: LayoutReserveMode
  size?: string | number
}

export interface FlowPlacement {
  kind: 'flow'
  region?: string
  sortScope?: string | false
}

export interface ChromePlacement {
  kind: 'chrome'
  edge: LayoutEdge
  position?: LayoutChromePosition
  reserve?: LayoutReserveSpec
  avoidContent?: boolean
}

export interface LayerPlacement {
  kind: 'layer'
  layer?: string
  mode?: LayoutLayerMode
  anchor?: LayoutAnchorSpec['anchor']
  offset?: LayoutOffsets
  avoid?: LayoutAvoidTarget[]
}

export type NodePlacement = FlowPlacement | ChromePlacement | LayerPlacement

export interface ResolvedFlowPlacement extends FlowPlacement {
  kind: 'flow'
  region: string
  sortScope: string | false
}

export interface ResolvedChromePlacement extends ChromePlacement {
  kind: 'chrome'
  position: LayoutChromePosition
  reserve: ResolvedLayoutReserveSpec
  avoidContent: boolean
}

export interface ResolvedLayerPlacement extends LayerPlacement {
  kind: 'layer'
  layer: string
  mode: LayoutLayerMode
  anchor: LayoutAnchorSpec['anchor']
  avoid: LayoutAvoidTarget[]
}

export type ResolvedNodePlacement = ResolvedFlowPlacement | ResolvedChromePlacement | ResolvedLayerPlacement

export interface LayoutInsetContribution {
  edge: LayoutEdge
  sourceNodeId: string
  reserve: ResolvedLayoutReserveSpec
}

export interface LayoutInsetPlan {
  contributors: LayoutInsetContribution[]
}

// ──────────────────────────────────────────
// Runtime state (non-persisted)
// ──────────────────────────────────────────

export interface DragTarget {
  /** ID of the node being dragged (null if dragging from material panel) */
  sourceNodeId: string | null
  /** Widget type being dragged from material panel (null if moving existing) */
  widgetType: string | null
}

// ──────────────────────────────────────────
// Behavior control types
// ──────────────────────────────────────────

/**
 * Context provided when evaluating per-instance behavior fields
 * (mask, selectable, draggable, sortable, deletable).
 * Available inside a computed — schema changes trigger re-evaluation.
 */
export interface InstanceBehaviorContext {
  /** The specific node being evaluated */
  node: SchemaNode
  /** The current designer schema (read from reactive ref) */
  schema: DesignerSchema
}

/**
 * Context provided when evaluating per-type behavior fields (creatable).
 * No specific node exists yet — used in the material panel.
 */
export interface TypeBehaviorContext {
  /** The widget type identifier */
  widgetType: string
  /** The current designer schema (read from reactive ref) */
  schema: DesignerSchema
}

/**
 * A behavior field that accepts either a static boolean or
 * a predicate function evaluated at runtime.
 *
 * @example
 * // Static
 * draggable: false
 *
 * // Dynamic
 * draggable: ({ node }) => node.type !== 'fixed'
 */
export type BehaviorPredicate<Ctx> = boolean | ((ctx: Ctx) => boolean)

/**
 * User-facing reason for a blocked creation attempt.
 *
 * `code` is stable for analytics and custom UI mapping.
 * `messageKey` lets applications provide localized copy.
 * `message` is the fallback text when no localized message exists.
 */
export interface CreationBlockReason {
  code?: string
  messageKey?: string
  message?: string
}

export interface CreatableDecision extends CreationBlockReason {
  allowed: boolean
}

/**
 * Type-level creation rule. Return `false` for a generic blocked state, or
 * return `{ allowed: false, messageKey, message }` to explain the reason.
 */
export type CreatableBehaviorResult = boolean | CreatableDecision
export type CreatableBehaviorPredicate = CreatableBehaviorResult | ((ctx: TypeBehaviorContext) => CreatableBehaviorResult)

// ──────────────────────────────────────────
// Container material protocol
// ──────────────────────────────────────────

export type ContainerVariantId = string
export type ContainerRegionId = string

export interface ContainerState {
  variant: ContainerVariantId
  regions: Record<ContainerRegionId, SchemaNode[]>
}

export interface ContainerRegionConstraints {
  includeTypes?: string[]
  excludeTypes?: string[]
  minItems?: number
  maxItems?: number
}

export interface ContainerRegionDefinition {
  id: ContainerRegionId
  title: string
  titleKey?: string
  constraints?: ContainerRegionConstraints
}

export interface ContainerVariantDefinition {
  title: string
  titleKey?: string
  regions: ContainerRegionDefinition[]
}

export interface PlacementDecision extends CreationBlockReason {
  allowed: boolean
  details?: Record<string, unknown>
}

export interface ContainerDefinition {
  defaultVariant: ContainerVariantId
  variants: Record<ContainerVariantId, ContainerVariantDefinition>
  createInitialState?: (ctx: ContainerInitContext) => ContainerState
  canPlace?: (ctx: ContainerPlacementContext) => PlacementDecision
  migrateVariant?: (ctx: ContainerVariantMigrationContext) => ContainerVariantMigrationResult
}

export interface ContainerInitContext {
  containerNode: Readonly<SchemaNode>
  schema: Readonly<DesignerSchema>
  createNode: (
    type: string,
    overrides?: Partial<Pick<SchemaNode, 'props' | 'style' | 'layout'>>,
  ) => SchemaNode
}

export interface ContainerPlacementContext {
  operation: 'add' | 'move'
  schema: Readonly<DesignerSchema>
  container: Readonly<SchemaNode>
  variant: Readonly<ContainerVariantDefinition>
  region: Readonly<ContainerRegionDefinition>
  child: Readonly<SchemaNode>
  targetIndex: number
}

export interface ContainerVariantMigrationContext {
  schema: Readonly<DesignerSchema>
  container: Readonly<SchemaNode>
  fromVariantId: ContainerVariantId
  toVariantId: ContainerVariantId
  fromVariant: Readonly<ContainerVariantDefinition>
  toVariant: Readonly<ContainerVariantDefinition>
  state: Readonly<ContainerState>
}

export type ContainerVariantMigrationResult
  = | { allowed: true, state: ContainerState }
    | ({ allowed: false } & Omit<PlacementDecision, 'allowed'>)

export type ContainerDefinitionValidationCode
  = | 'CONTAINER_DEFINITION_INVALID'
    | 'CONTAINER_VARIANTS_INVALID'
    | 'CONTAINER_VARIANT_INVALID'
    | 'CONTAINER_REGIONS_INVALID'
    | 'CONTAINER_REGION_INVALID'
    | 'CONTAINER_CONSTRAINTS_INVALID'
    | 'CONTAINER_DEFAULT_VARIANT_MISSING'
    | 'CONTAINER_VARIANT_ID_RESERVED'
    | 'CONTAINER_REGION_ID_RESERVED'
    | 'CONTAINER_REGION_ID_DUPLICATE'
    | 'CONTAINER_CARDINALITY_INVALID'
    | 'CONTAINER_TYPE_ID_INVALID'

export interface ContainerDefinitionValidationError {
  code: ContainerDefinitionValidationCode
  path: string
}

export interface ContainerDefinitionValidationResult {
  valid: boolean
  errors: ContainerDefinitionValidationError[]
}

export interface ContainerPlanRegion {
  definition: ContainerRegionDefinition
  nodes: SchemaNode[]
  isEmpty: boolean
}

export interface ContainerPlan {
  containerId: string
  variant: ContainerVariantDefinition
  regions: ContainerPlanRegion[]
}

export type ContainerPlanResult
  = | { ok: true, plan: ContainerPlan }
    | {
      ok: false
      code: 'CONTAINER_UNRESOLVED' | 'CONTAINER_VARIANT_UNKNOWN'
      containerId: string
    }

export type CreateRegisteredNode = ContainerInitContext['createNode']

export type ContainerStateCreationResult
  = | { ok: true, state: ContainerState }
    | {
      ok: false
      code: string
      message?: string
      details?: Record<string, unknown>
    }

export interface ResolvePlacementContext {
  definition: ContainerDefinition
  region: ContainerRegionDefinition
  child: SchemaNode
  childHasContainerCapability: boolean
  targetCount: number
  callbackContext: ContainerPlacementContext
}

// ──────────────────────────────────────────
// Form schema shape (minimal, for WidgetMeta.formSchema typing)
// ──────────────────────────────────────────

/**
 * Minimal form field schema shape.
 * Matches the structural contract of `@dragcraft/form-generator` FieldSchema
 * without creating a package dependency.
 */
export interface FieldSchemaShape {
  key: string
  label: string
  component: string
  [key: string]: unknown
}

/**
 * Minimal form schema shape for widget property panels.
 * Matches the structural contract of `@dragcraft/form-generator` FormSchema
 * without creating a package dependency.
 */
export interface FormSchemaShape {
  sections: Array<{
    title: string
    fields: FieldSchemaShape[]
    [key: string]: unknown
  }>
}

// ──────────────────────────────────────────
// Widget meta protocol
// ──────────────────────────────────────────

/**
 * Per-widget action configuration.
 * Controls which actions appear in the node toolbar for this widget type.
 */
export interface CoreWidgetActionConfig {
  /** If provided, only show actions with these keys */
  only?: string[]
  /** Exclude actions with these keys */
  exclude?: string[]
}

/**
 * Widget meta protocol — the contract every widget registers with the engine.
 */
export interface CoreWidgetMeta {
  /** Unique widget type identifier */
  type: string
  /** Human-readable title for material panel */
  title: string
  /** i18n message key for title; overrides `title` when i18n is active */
  titleKey?: string
  /** Group for categorization in material panel */
  group: string
  /** Icon identifier */
  icon?: string
  /** Default prop values when creating a new instance */
  defaultProps: Record<string, unknown>
  /** Default scoped styles when creating a new instance */
  defaultStyle?: NodeStyle
  /** Form schema for the property panel */
  formSchema: FormSchemaShape
  /** Structural container capabilities for this widget type. */
  container?: ContainerDefinition

  // ── Renderer behavior controls ──

  /** Whether to render a mask overlay on the widget in the canvas (default: true). Accepts boolean or predicate. */
  mask?: BehaviorPredicate<InstanceBehaviorContext>
  /** Whether this widget can be selected in the canvas (default: true). Accepts boolean or predicate. */
  selectable?: BehaviorPredicate<InstanceBehaviorContext>
  /** Whether this widget can be dragged to reorder (default: true). Accepts boolean or predicate. */
  draggable?: BehaviorPredicate<InstanceBehaviorContext>
  /**
   * Whether this widget's position can be changed by reordering (default: true).
   * When false, the widget is locked at its current array index — it cannot
   * be dragged, and operations on other widgets that would shift this widget's
   * index are forbidden. Implies draggable=false.
   */
  sortable?: BehaviorPredicate<InstanceBehaviorContext>
  /** Whether this widget can be deleted via toolbar action (default: true). Accepts boolean or predicate. */
  deletable?: BehaviorPredicate<InstanceBehaviorContext>
  /** Default open layout metadata for new and existing instances of this widget type. */
  defaultLayout?: NodeLayout

  // ── Creation controls ──

  /**
   * Whether new instances of this widget type can be created (default: true).
   * Applies to every ADD_NODE entry, including material drops and duplicate
   * actions. Evaluated per-type, not per-instance.
   */
  creatable?: CreatableBehaviorPredicate

  // ── Action system ──

  /** Per-widget toolbar action configuration */
  actions?: CoreWidgetActionConfig
}

export type WidgetMeta = CoreWidgetMeta
export type WidgetActionConfig = CoreWidgetActionConfig

// ──────────────────────────────────────────
// Command system
// ──────────────────────────────────────────

export interface Command<T = unknown> {
  type: string
  payload: T
}

export interface CommandContext {
  store: SchemaStoreInstance
  registry: RegistryInstance
}

export type CommandExecutionResult
  = | { ok: true, eventPayload?: unknown }
    | ({ ok: false, code: string } & CreationBlockReason & { details?: Record<string, unknown> })

export type CommandResult = false | void | CommandExecutionResult

export function commandFailure(
  code: string,
  reason: Omit<Extract<CommandExecutionResult, { ok: false }>, 'ok' | 'code'> = {},
): Extract<CommandExecutionResult, { ok: false }> {
  return { ok: false, code, ...reason }
}

export type CommandHandler<T = unknown> = (
  ctx: CommandContext,
  payload: T,
) => CommandResult

// ──────────────────────────────────────────
// Command payloads (built-in)
// ──────────────────────────────────────────

export interface AddNodePayload {
  node: SchemaNode
  destination?: NodeDestination
}

export interface MoveNodePayload {
  nodeId: string
  destination: NodeDestination
}

export interface RemoveNodePayload {
  nodeId: string
}

export interface DuplicateNodePayload {
  nodeId: string
}

export interface ChangeContainerVariantPayload {
  containerId: string
  variant: ContainerVariantId
}

export interface UpdatePropsPayload {
  nodeId: string
  props: Record<string, unknown>
  style?: NodeStyle
}

export interface SetGlobalConfigPayload {
  config: Record<string, unknown>
}

// ──────────────────────────────────────────
// History snapshot
// ──────────────────────────────────────────

export interface HistoryEntry {
  label: string
  snapshot: DesignerSchema
}

// ──────────────────────────────────────────
// Engine options
// ──────────────────────────────────────────

export interface EngineOptions {
  initialSchema?: DesignerSchema
  maxHistorySize?: number
}

export interface EngineState {
  getSchema: () => DesignerSchema
  getNodeById: (id: string) => SchemaNode | null
  getSelectedNodeId: () => string | null
  getHoveredNodeId: () => string | null
  getDragTarget: () => DragTarget | null
}

// ──────────────────────────────────────────
// Schema migration
// ──────────────────────────────────────────

/**
 * A single migration step that transforms a schema from one version to another.
 */
export interface SchemaMigration {
  /** The version this migration upgrades from */
  fromVersion: string
  /** The version this migration upgrades to */
  toVersion: string
  /** Transform function — receives the old schema, returns the migrated schema */
  migrate: (schema: DesignerSchema) => DesignerSchema
}

// ──────────────────────────────────────────
// Instance interfaces (avoid circular deps)
// ──────────────────────────────────────────

export interface SchemaStoreInstance {
  readonly schema: ShallowRef<DesignerSchema>
  readonly selectedNodeId: Ref<string | null>
  readonly hoveredNodeId: Ref<string | null>
  readonly dragTarget: Ref<DragTarget | null>
  getSchema: () => DesignerSchema
  getRawSchema: () => DesignerSchema
  setSchema: (schema: DesignerSchema) => void
  selectNode: (id: string | null) => void
  hoverNode: (id: string | null) => void
  setDragTarget: (target: DragTarget | null) => void
  getNodeById: (id: string) => SchemaNode | null
  applyTransientPatch: (nodeId: string, partial: Partial<Pick<SchemaNode, 'props' | 'style'>>) => void
  triggerUpdate: () => void
}

export interface RegistryInstance {
  registerWidget: (meta: WidgetMeta) => void
  registerGlobalConfigSchema: (schema: Record<string, unknown>) => void
  registerGlobalConfigFormSchema: (schema: FormSchemaShape) => void
  getWidget: (type: string) => WidgetMeta | undefined
  getGlobalConfigSchema: () => Record<string, unknown> | undefined
  getAllWidgets: () => WidgetMeta[]
}
