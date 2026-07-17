import type { CommandExecutionResult, CreationBlockReason, DesignerEngine, DesignerSchema, EngineOptions, NodeDestination, PlacementDecision, SchemaStoreInstance } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { ActionInterceptor, ComponentMap, ContainerDropRejection, ContainerDropTarget, NodeActionDefinition, NodeActionRegistry, RendererEventHooks, RendererExtensions, RendererWidgetMeta } from '@dragcraft/renderer'
import type { I18nInstance, LocaleMessages } from '@dragcraft/utils'
import type { Component, InjectionKey, Ref, VNodeChild } from 'vue'

export type DesignerWorkspaceMode = 'wide' | 'compact'

export interface DesignerWorkspaceOptions {
  compactBreakpoint?: number
  defaultLeftOpen?: boolean
  defaultRightOpen?: boolean
  keyboardShortcuts?: boolean
  leftPanelWidth?: number
  rightPanelWidth?: number
  railWidth?: number
  drawerWidth?: number
}

export interface DesignerWorkspaceController {
  readonly compactBreakpoint: number
  readonly keyboardShortcuts: boolean
  readonly leftPanelWidth: number
  readonly rightPanelWidth: number
  readonly railWidth: number
  readonly drawerWidth: number
  mode: Ref<DesignerWorkspaceMode>
  leftOpen: Ref<boolean>
  rightOpen: Ref<boolean>
  activeLeftPanel: Ref<LeftPanelTabKey>
  activeRightPanel: Ref<PropertyTabKey>
  setMode: (mode: DesignerWorkspaceMode) => void
  openLeft: (panel?: LeftPanelTabKey) => void
  closeLeft: () => void
  toggleLeft: (panel?: LeftPanelTabKey) => void
  openRight: (panel?: PropertyTabKey) => void
  closeRight: () => void
  toggleRight: (panel?: PropertyTabKey) => void
  closeDrawers: () => void
}

// ──────────────────────────────────────────
// Widget group config (inline definition to avoid @dragcraft/widgets dependency)
// ──────────────────────────────────────────

/**
 * Widget group configuration with display title.
 * Used by DcMaterialPanel to organize widgets into named groups.
 */
export interface WidgetGroupConfig {
  /** Group identifier (matches WidgetMeta.group) */
  name: string
  /** Display title shown in the material panel */
  title: string
  /** i18n message key for title; overrides `title` when i18n is active */
  titleKey?: string
}

// ──────────────────────────────────────────
// Material item display protocol
// ──────────────────────────────────────────

export type MaterialItemIcon = string | Component

/**
 * Designer-owned display metadata for a widget in the material panel.
 * Core registration remains UI-agnostic; this protocol only affects designer UI.
 */
export interface MaterialDisplayMeta {
  /** Material panel title override. Falls back to WidgetMeta.title/titleKey. */
  title?: string
  /** i18n message key for material panel title. */
  titleKey?: string
  /** Icon or Vue component shown in the material panel. Falls back to WidgetMeta.icon. */
  icon?: MaterialItemIcon
  /** Short supporting copy for richer material cards. */
  description?: string
  /** i18n message key for description. */
  descriptionKey?: string
  /** Image URL for visual material cards. */
  thumbnail?: string
  /** Compact labels shown by custom material item renderers. */
  tags?: string[]
  /** Additional search terms for the material panel. */
  keywords?: string[]
  /** App-specific display data for custom material item renderers. */
  metadata?: Record<string, unknown>
}

/**
 * Widget metadata accepted by designer. Extends renderer metadata with
 * material-panel display information without coupling core to Vue UI.
 */
export interface DesignerWidgetMeta extends RendererWidgetMeta {
  material?: MaterialDisplayMeta
}

export interface ResolvedMaterialItem {
  title: string
  icon?: MaterialItemIcon
  description?: string
  thumbnail?: string
  tags: string[]
  keywords: string[]
}

export interface MaterialItemRenderProps {
  meta: DesignerWidgetMeta
  material: ResolvedMaterialItem
  draggable: boolean
  disabled: boolean
  dragging: boolean
}

// ──────────────────────────────────────────
// Designer options (input to createDesigner)
// ──────────────────────────────────────────

/**
 * Options accepted by createDesigner.
 *
 * Users must explicitly provide widget metas, component maps, and field maps.
 */
export interface DesignerOptions {
  /** Core engine options (initialSchema, maxHistorySize) */
  engineOptions?: EngineOptions
  /** Widget metas to register with the engine */
  widgetMetas?: DesignerWidgetMeta[]
  /** Widget type → Vue component map for canvas rendering */
  componentMap?: ComponentMap
  /** Widget group configurations for material panel. If not provided, groups are derived from registered widgets. */
  widgetGroups?: WidgetGroupConfig[]
  /** Field type → Vue component map for form-generator */
  fieldComponentMap?: FieldComponentMap
  /** Global config form schema for the right panel Global tab */
  globalConfigSchema?: FormSchema
  /** Extension point overrides */
  extensions?: DesignerExtensions
  /** Renderer event hooks for selection, drag, and hover */
  eventHooks?: RendererEventHooks
  /** Interceptors for node actions such as delete, move, duplicate, and custom actions */
  actionInterceptors?: ActionInterceptor[]
  /** Custom node action definitions to add or override default actions */
  customActions?: NodeActionDefinition[]
  /** Current locale (default: 'zh-CN') */
  locale?: string
  /** Additional/override messages merged on top of designer and renderer defaults */
  messages?: LocaleMessages
  /** Workbench layout and keyboard behavior. */
  workspace?: DesignerWorkspaceOptions
}

// ──────────────────────────────────────────
// Sidebar rail slot API
// ──────────────────────────────────────────

export interface DesignerRailSlotAPI {
  engine: DesignerEngine
  workspace: DesignerWorkspaceController
  t: I18nInstance['t']
}

// ──────────────────────────────────────────
// Extension points
// ──────────────────────────────────────────

/**
 * All available designer extension points.
 */
export interface DesignerExtensions {
  /** Completely replace the left material panel */
  materialPanelRenderer?: Component
  /** Completely replace the right property panel */
  propertyPanelRenderer?: Component
  /** Custom content renderer for a single material item. Designer owns the outer shell and drag behavior. */
  materialItemRenderer?: (props: MaterialItemRenderProps) => VNodeChild
  /** Renderer extensions (dropIndicator) forwarded to @dragcraft/renderer */
  rendererExtensions?: RendererExtensions
  /** Optional controls appended to the left sidebar rail. */
  leftRailRenderer?: (api: DesignerRailSlotAPI) => VNodeChild
  /** Optional controls appended to the right sidebar rail. */
  rightRailRenderer?: (api: DesignerRailSlotAPI) => VNodeChild
}

// ──────────────────────────────────────────
// Designer instance (returned by createDesigner)
// ──────────────────────────────────────────

/**
 * The object returned by createDesigner().
 * Holds the core engine and resolved configuration.
 */
export interface DesignerInstance {
  /** The underlying core engine */
  engine: DesignerEngine
  /** Merged component map (default + extra) */
  componentMap: ComponentMap
  /** Widget group configurations for material panel */
  widgetGroups: WidgetGroupConfig[] | undefined
  /** Resolved designer extensions */
  extensions: DesignerExtensions
  /** Override field component map for form-generator */
  fieldComponentMap: FieldComponentMap | undefined
  /** Global config form schema, if provided */
  globalConfigSchema: FormSchema | null
  /** Renderer event hooks */
  eventHooks: RendererEventHooks
  /** Node action interceptors */
  actionInterceptors: ActionInterceptor[]
  /** Node action registry */
  actionRegistry: NodeActionRegistry
  /** i18n instance for locale management */
  i18n: I18nInstance
  workspace: DesignerWorkspaceController
  /** Dispose all resources */
  dispose: () => void
}

// ──────────────────────────────────────────
// Designer context (provide/inject)
// ──────────────────────────────────────────

/**
 * Internal context provided to all designer descendants via provide/inject.
 */
export interface DesignerContext {
  engine: DesignerEngine
  componentMap: ComponentMap
  widgetGroups: WidgetGroupConfig[] | undefined
  extensions: DesignerExtensions
  fieldComponentMap: FieldComponentMap | undefined
  globalConfigSchema: FormSchema | null
  eventHooks: RendererEventHooks
  actionInterceptors: ActionInterceptor[]
  actionRegistry: NodeActionRegistry
  workspace: DesignerWorkspaceController
  activeDestination: Ref<NodeDestination | null>
  containerDropDecision: Ref<PlacementDecision | null>
  dragOverNodeId: Ref<string | null>
  dragOverIndex: Ref<number | null>
  handleMaterialDragStart: (e: DragEvent, meta: RendererWidgetMeta) => void
  handleDragEnd: (e: DragEvent) => void
  handleCanvasDragOver: (e: DragEvent) => void
  handleCanvasDragLeave: (e: DragEvent) => void
  handleCanvasDrop: (e: DragEvent) => CommandExecutionResult
  handleContainerDragOver: (payload: ContainerDropTarget | ContainerDropRejection) => void
  handleContainerDragLeave: (e: DragEvent) => void
  handleContainerDrop: (e: DragEvent) => CommandExecutionResult
  /** Whether the current drag-over is forbidden */
  isForbidden: Ref<boolean>
  /** User-facing reason for the current forbidden drag-over state */
  forbiddenReason: Ref<(CreationBlockReason & { details?: Record<string, unknown> }) | null>
  searchQuery: Ref<string>
  activeTab: Ref<PropertyTabKey>
  leftPanelActiveTab: Ref<LeftPanelTabKey>
}

/**
 * Injection key for the designer context.
 */
export const DESIGNER_CONTEXT_KEY: InjectionKey<DesignerContext> = Symbol('dc-designer')

// ──────────────────────────────────────────
// Property tab type
// ──────────────────────────────────────────

export type PropertyTabKey = 'global' | 'widget'

// ──────────────────────────────────────────
// Left panel tab type
// ──────────────────────────────────────────

export type LeftPanelTabKey = 'materials' | 'structure'

// ──────────────────────────────────────────
// useDesigner return type
// ──────────────────────────────────────────

/**
 * Return type of useDesigner composable.
 */
export interface UseDesignerReturn {
  /** Reactive schema (from engine.store.schema ShallowRef) */
  schema: SchemaStoreInstance['schema']
  /** Currently selected node ID (reactive) */
  selectedNodeId: SchemaStoreInstance['selectedNodeId']
  /** Currently hovered node ID (reactive) */
  hoveredNodeId: SchemaStoreInstance['hoveredNodeId']
  /** Execute a command through the engine */
  execute: DesignerEngine['execute']
  /** Undo last change */
  undo: () => void
  /** Redo last undone change */
  redo: () => void
  /** Whether undo is available */
  canUndo: () => boolean
  /** Whether redo is available */
  canRedo: () => boolean
  /** Import a full schema (replaces current) */
  importSchema: (schema: DesignerSchema) => void
  /** Export current schema (deep clone) */
  exportSchema: () => DesignerSchema
  /** Subscribe to engine events */
  on: DesignerEngine['eventHub']['on']
  /** Unsubscribe from engine events */
  off: DesignerEngine['eventHub']['off']
}
