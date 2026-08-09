import type { DocumentSchema } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { I18nInstance, LocaleMessages } from '@dragcraft/i18n'
import type { CreationBlockReason, DesignerSchema, EngineOptions, NodeDestination, PlacementDecision } from '@dragcraft/legacy-core'
import type { Component, InjectionKey, Ref, VNodeChild } from 'vue'
import type { AuthoringEngine, DesignerHistory, DesignerSelection, AuthoringAction as EngineAuthoringAction, AuthoringResult as EngineAuthoringResult, SchemaLoadResult } from './authoring/types'
import type { MaterialDefinition } from './materials/types'
import type { NodeActionDefinition, NodeActionRegistry } from './presentation/action-registry'
import type { ActionInterceptor } from './presentation/action-runtime'
import type { RendererEventHooks } from './presentation/event-hooks'
import type { AuthoringResult, ComponentMap, ContainerDropRejection, ContainerDropTarget, RendererExtensions, RendererWidgetMeta } from './presentation/types'

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

export interface DesignerEngineOptions extends EngineOptions {
  initialSchema?: DesignerSchema
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

export interface MaterialPanelGroup {
  readonly name: string
  readonly title: string
  readonly titleKey?: string
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
 * A material definition is the only registration input for a node type.
 */
export interface DesignerOptions {
  /** Final document snapshot used by the Next backend. */
  schema?: DocumentSchema
  /** Single material registration surface used by the Next backend. */
  materials: readonly MaterialDefinition[]
  /** Maximum number of undoable document revisions. */
  maxHistoryEntries?: number
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
  /** Presentation extensions forwarded to the Designer canvas. */
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
 * The host control interface returned by createDesigner().
 */
export interface DesignerInstance {
  readonly document: AuthoringEngine['document']
  readonly selection: Readonly<DesignerSelection>
  readonly history: Readonly<DesignerHistory>
  execute: (action: EngineAuthoringAction) => EngineAuthoringResult
  importSchema: (input: unknown) => SchemaLoadResult
  exportSchema: () => DocumentSchema | null
  setLocale: (locale: string) => void
  dispose: () => void
}

// ──────────────────────────────────────────
// Designer context (provide/inject)
// ──────────────────────────────────────────

/**
 * Internal context provided to all designer descendants via provide/inject.
 */
export interface DesignerContext {
  componentMap: ComponentMap
  materialGroups: readonly MaterialPanelGroup[]
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
  handleCanvasDrop: (e: DragEvent) => AuthoringResult
  handleContainerDragOver: (payload: ContainerDropTarget | ContainerDropRejection) => void
  handleContainerDragLeave: (e: DragEvent) => void
  handleContainerDrop: (e: DragEvent) => AuthoringResult
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
  /** Reactive final document schema, or null after a rejected import. */
  schema: import('vue').ComputedRef<DocumentSchema | null>
  /** Currently selected node ID (reactive). */
  selectedNodeId: DesignerSelection['selectedNodeId']
  /** Currently hovered node ID (reactive). */
  hoveredNodeId: DesignerSelection['hoveredNodeId']
  /** Execute an authoring action through the active session */
  execute: DesignerInstance['execute']
  /** Undo last change */
  undo: () => void
  /** Redo last undone change */
  redo: () => void
  /** Whether undo is available */
  canUndo: () => boolean
  /** Whether redo is available */
  canRedo: () => boolean
  /** Import a full schema (replaces current) */
  importSchema: DesignerInstance['importSchema']
  /** Export current schema (deep clone) */
  exportSchema: DesignerInstance['exportSchema']
}
