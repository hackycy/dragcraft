import type { DesignerEngine, DesignerSchema, EngineOptions, SchemaStoreInstance, WidgetMeta } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { ComponentMap, NodeActionDefinition, NodeActionRegistry, RendererEventHooks, RendererExtensions } from '@dragcraft/renderer'
import type { Component, InjectionKey, Ref, VNodeChild } from 'vue'

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
}

// ──────────────────────────────────────────
// Designer options (input to createDesigner)
// ──────────────────────────────────────────

/**
 * Options accepted by createDesigner.
 *
 * Users must explicitly provide widget metas and component maps.
 * Use `@dragcraft/builtin-widgets` and `@dragcraft/builtin-fields` for built-in defaults.
 */
export interface DesignerOptions {
  /** Core engine options (initialSchema, maxHistorySize) */
  engineOptions?: EngineOptions
  /** Widget metas to register with the engine */
  widgetMetas?: WidgetMeta[]
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
  /** Renderer event hooks (interceptors for select, delete, move, drag) */
  eventHooks?: RendererEventHooks
  /** Custom node action definitions to add or override default actions */
  customActions?: NodeActionDefinition[]
}

// ──────────────────────────────────────────
// Toolbar slot API
// ──────────────────────────────────────────

/**
 * API object passed to the toolbarRenderer extension function.
 * Provides common operations for toolbar buttons.
 */
export interface ToolbarSlotAPI {
  /** Undo the last operation */
  undo: () => void
  /** Redo the last undone operation */
  redo: () => void
  /** Whether undo is available */
  canUndo: () => boolean
  /** Whether redo is available */
  canRedo: () => boolean
  /** Execute a command through the engine */
  execute: DesignerEngine['execute']
  /** The underlying engine instance for advanced use */
  engine: DesignerEngine
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
  /** Custom render function for a single material item card */
  renderWidgetItem?: (meta: WidgetMeta) => Component
  /** Renderer extensions (dropIndicator) forwarded to @dragcraft/renderer */
  rendererExtensions?: RendererExtensions
  /**
   * Custom toolbar content renderer, displayed inside the canvas area.
   * Receives a ToolbarSlotAPI with undo/redo and engine operations.
   * Return VNodes to render inside the toolbar container.
   */
  toolbarRenderer?: (api: ToolbarSlotAPI) => VNodeChild
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
  /** Node action registry */
  actionRegistry: NodeActionRegistry
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
  actionRegistry: NodeActionRegistry
  dragOverNodeId: Ref<string | null>
  searchQuery: Ref<string>
  activeTab: Ref<PropertyTabKey>
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
