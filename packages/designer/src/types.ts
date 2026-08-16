import type { DocumentSchema } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { I18nInstance, LocaleMessages } from '@dragcraft/i18n'
import type { Component, InjectionKey, Ref, ShallowRef, VNodeChild } from 'vue'
import type { DesignerDocumentState, DesignerHistory, DesignerSelection, AuthoringAction as EngineAuthoringAction, AuthoringResult as EngineAuthoringResult, SchemaLoadResult } from './authoring/types'
import type { MaterialDefinition } from './materials/types'
import type { NodeActionDefinition, NodeActionRegistry } from './presentation/action-registry'
import type { ActionInterceptor } from './presentation/action-runtime'
import type { CreationBlockReason, NodeDestination, PlacementDecision } from './presentation/semantic'
import type { AuthoringResult, ContainerDropRejection, ContainerDropTarget } from './presentation/types'

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

export type MaterialItemIcon = string | Component

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
  meta: Readonly<MaterialDefinition>
  material: ResolvedMaterialItem
  draggable: boolean
  disabled: boolean
  dragging: boolean
}

/**
 * Host-owned device shell for the Designer Application Surface.
 * The shell is a presentation-only slot boundary and never receives Schema state.
 */
export interface DesignerDeviceFrame {
  readonly id: string
  readonly containerShell: Component
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
  /** Field type → Vue material preview map for form-generator */
  fieldComponentMap?: FieldComponentMap
  /** Global config form schema for the right panel Global tab */
  globalConfigSchema?: FormSchema
  /** Extension point overrides */
  extensions?: DesignerExtensions
  /** Interceptors for node actions such as delete, move, duplicate, and custom actions */
  actionInterceptors?: ActionInterceptor[]
  /** Custom node action definitions to add or override default actions */
  customActions?: NodeActionDefinition[]
  /** Current locale (default: 'zh-CN') */
  locale?: string
  /** Additional/override messages merged on top of Designer and Presentation defaults */
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
  readonly document: ShallowRef<DesignerDocumentState>
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
  materialGroups: readonly MaterialPanelGroup[]
  extensions: DesignerExtensions
  fieldComponentMap: FieldComponentMap | undefined
  globalConfigSchema: FormSchema | null
  deviceFrame: Ref<DesignerDeviceFrame | undefined>
  actionInterceptors: ActionInterceptor[]
  actionRegistry: NodeActionRegistry
  workspace: DesignerWorkspaceController
  activeDestination: Ref<NodeDestination | null>
  containerDropDecision: Ref<PlacementDecision | null>
  dragOverNodeId: Ref<string | null>
  dragOverIndex: Ref<number | null>
  handleMaterialDragStart: (e: DragEvent, material: Readonly<MaterialDefinition>) => void
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
