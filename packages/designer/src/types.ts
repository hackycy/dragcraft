import type { DesignerEngine, DesignerSchema, EngineOptions, SchemaStoreInstance, WidgetMeta } from '@dragcraft/core'
import type { FieldComponentMap, FormSchema } from '@dragcraft/form-generator'
import type { ComponentMap, NodeActionDefinition, NodeActionRegistry, RendererEventHooks, RendererExtensions } from '@dragcraft/renderer'
import type { Component, InjectionKey, Ref, VNodeChild } from 'vue'

// ──────────────────────────────────────────
// Designer options (input to createDesigner)
// ──────────────────────────────────────────

/**
 * Options accepted by createDesigner.
 */
export interface DesignerOptions {
  /** Core engine options (initialSchema, maxHistorySize) */
  engineOptions?: EngineOptions
  /** Whether to auto-register built-in widgets (default: true) */
  registerDefaultWidgets?: boolean
  /** Additional widget metas to register beyond built-in ones */
  extraWidgets?: WidgetMeta[]
  /** Additional component map entries to merge with defaults */
  extraComponentMap?: ComponentMap
  /** Override field component map for form-generator */
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
