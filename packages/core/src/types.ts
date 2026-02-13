import type { Ref, ShallowRef } from '@vue/reactivity'

// ──────────────────────────────────────────
// Node types
// ──────────────────────────────────────────

export type NodeType = 'container' | 'widget'

export interface SchemaNode {
  id: string
  type: string
  nodeType: NodeType
  props: Record<string, unknown>
  style?: Record<string, unknown>
  children?: SchemaNode[]
}

// ──────────────────────────────────────────
// Document schema
// ──────────────────────────────────────────

export interface DesignerSchema {
  version: string
  globalConfig: Record<string, unknown>
  root: SchemaNode
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
// Widget & Container meta protocols
// ──────────────────────────────────────────

export interface WidgetMeta {
  type: string
  title: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  defaultStyle?: Record<string, unknown>
  formSchema: Record<string, unknown>
  canHaveChildren?: boolean
}

export interface ContainerMeta {
  type: string
  title: string
  icon?: string
  defaultProps?: Record<string, unknown>
  defaultStyle?: Record<string, unknown>
}

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

export type CommandHandler<T = unknown> = (
  ctx: CommandContext,
  payload: T,
) => void

// ──────────────────────────────────────────
// Command payloads (built-in)
// ──────────────────────────────────────────

export interface AddNodePayload {
  parentId: string
  node: SchemaNode
  index?: number
}

export interface MoveNodePayload {
  nodeId: string
  targetParentId: string
  index?: number
}

export interface RemoveNodePayload {
  nodeId: string
}

export interface UpdatePropsPayload {
  nodeId: string
  props: Record<string, unknown>
  style?: Record<string, unknown>
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
  patchNode: (nodeId: string, partial: Partial<Pick<SchemaNode, 'props' | 'style'>>) => void
  triggerUpdate: () => void
}

export interface RegistryInstance {
  registerWidget: (meta: WidgetMeta) => void
  registerContainer: (meta: ContainerMeta) => void
  registerGlobalConfigSchema: (schema: Record<string, unknown>) => void
  getWidget: (type: string) => WidgetMeta | undefined
  getContainer: (type: string) => ContainerMeta | undefined
  getGlobalConfigSchema: () => Record<string, unknown> | undefined
  getAllWidgets: () => WidgetMeta[]
  getAllContainers: () => ContainerMeta[]
}
