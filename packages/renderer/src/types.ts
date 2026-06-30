import type { DesignerEngine, WidgetMeta } from '@dragcraft/core'
import type { Component, ComputedRef, InjectionKey, Ref } from 'vue'
import type { NodeActionRegistry, ResolvedNodeAction } from './action-registry'
import type { RendererEventHooks } from './event-hooks'

// ──────────────────────────────────────────
// Component resolution
// ──────────────────────────────────────────

/**
 * Maps a node's `type` string to a Vue component.
 *
 * Example: { button: ButtonWidget, text: TextWidget }
 */
export type ComponentMap = Record<string, Component>

// ──────────────────────────────────────────
// Extension component prop interfaces
// ──────────────────────────────────────────

/**
 * Props received by a custom nodeWrapper component.
 * Must render a default slot containing the widget content.
 */
export interface NodeWrapperProps {
  /** The schema node ID being wrapped */
  nodeId: string
  /** The widget type string */
  nodeType: string
  /** Reactive interaction state */
  state: NodeInteractionState
  /** The resolved widget meta, if available */
  meta: WidgetMeta | undefined
}

/**
 * Viewport-relative position coordinates for floating toolbar.
 * When provided, the toolbar uses position: fixed to escape overflow clipping.
 */
export interface ToolbarPositionData {
  /** CSS top in pixels (viewport-relative) */
  top: number
  /** CSS left in pixels (viewport-relative) */
  left: number
  /** Whether the toolbar should be visible (widget is at least partially in viewport) */
  visible: boolean
}

/**
 * Props received by a custom nodeToolbar component.
 */
export interface NodeToolbarProps {
  /** The schema node ID */
  nodeId: string
  /** The widget type string */
  nodeType: string
  /** Pre-resolved actions for this node */
  actions: ResolvedNodeAction[]
  /** Reactive interaction state */
  state: NodeInteractionState
  /** Drag start handler for drag-handle type actions */
  onDragStart: (e: DragEvent) => void
  /** Drag end handler for drag-handle type actions */
  onDragEnd: (e: DragEvent) => void
  /**
   * Viewport-relative position for fixed positioning.
   * When provided, the toolbar escapes overflow clipping by using position: fixed.
   * If not provided, falls back to position: absolute behavior.
   */
  toolbarPosition?: ToolbarPositionData
}

/**
 * Props received by a custom nodeMask component.
 */
export interface NodeMaskProps {
  /** The schema node ID */
  nodeId: string
  /** The widget type string */
  nodeType: string
  /** Select handler to call on click */
  onSelect: (e: MouseEvent) => void
}

/**
 * Props received by a custom nodeHandle component.
 */
export interface NodeHandleProps {
  /** The schema node ID */
  nodeId: string
  /** The widget type string */
  nodeType: string
  /** Select handler to call on click */
  onSelect: (e: MouseEvent) => void
}

/**
 * Props received by a custom emptyState component.
 */
export interface EmptyStateProps {
  /** Whether a drag operation is currently over the canvas */
  isDragOver: boolean
}

/**
 * Props received by a custom forbiddenOverlay component.
 */
export interface ForbiddenOverlayProps {
  /** The widget type that was blocked */
  widgetType: string
}

/**
 * Props received by a custom widgetFallback component.
 */
export interface WidgetFallbackProps {
  /** The schema node ID */
  nodeId: string
  /** The unresolved widget type string */
  nodeType: string
}

// ──────────────────────────────────────────
// Extension points
// ──────────────────────────────────────────

export interface RendererExtensions {
  /**
   * Replaces the default root canvas wrapper.
   * E.g., a phone frame, tablet frame, or custom viewport shell.
   * Must provide a default slot for children.
   */
  containerShell?: Component

  /**
   * Replaces the default drop indicator shown inside containers
   * during drag-over state.
   */
  dropIndicator?: Component

  /**
   * Wraps each rendered widget node. Receives NodeWrapperProps.
   * Must render a default slot containing the widget content.
   * Use this to add custom chrome, annotations, badges, etc.
   */
  nodeWrapper?: Component

  /**
   * Replaces the default per-node floating toolbar.
   * Receives NodeToolbarProps with pre-resolved actions.
   */
  nodeToolbar?: Component

  /**
   * Replaces the default mask overlay for mask=true widgets.
   * Receives NodeMaskProps.
   */
  nodeMask?: Component

  /**
   * Replaces the default selection handle for mask=false widgets.
   * Receives NodeHandleProps.
   */
  nodeHandle?: Component

  /**
   * Replaces the default "drag components here" empty state.
   * Receives EmptyStateProps.
   */
  emptyState?: Component

  /**
   * Replaces the default fallback for unknown widget types.
   * Receives WidgetFallbackProps.
   */
  widgetFallback?: Component

  /**
   * Replaces the default forbidden overlay shown when a widget type
   * cannot be dropped (e.g., singleton already exists).
   * Receives ForbiddenOverlayProps.
   */
  forbiddenOverlay?: Component
}

// ──────────────────────────────────────────
// Renderer options and context
// ──────────────────────────────────────────

/**
 * Options accepted by RootRenderer as props.
 *
 * **Immutability constraint:** These options are captured once when RootRenderer
 * mounts and provided to all descendants via provide/inject. Changing them after
 * the initial render has no effect on the running renderer. If you need to swap
 * extensions or hooks, remount RootRenderer with a different `key`.
 */
export interface RendererOptions {
  /** The core engine instance (read-only consumption) */
  engine: DesignerEngine
  /** Maps node.type -> Vue component for rendering */
  componentMap: ComponentMap
  /** Optional extension point overrides */
  extensions?: RendererExtensions
  /** Interceptable event hooks for renderer events */
  eventHooks?: RendererEventHooks
  /** Node action registry. If not provided, default actions are used. */
  actionRegistry?: NodeActionRegistry
  /**
   * Optional reactive ref tracking whether root is being dragged over.
   * Managed externally by the designer package.
   * If not provided, drag-over visual state is disabled.
   */
  dragOverNodeId?: Ref<string | null>
  /**
   * Optional reactive ref tracking the visual insertion index during drag-over.
   * Determines where the drop indicator is rendered within the widget list.
   * Managed externally by the designer package.
   */
  dragOverIndex?: Ref<number | null>
  /**
   * Optional max right boundary for toolbar positioning (viewport px).
   * Prevents toolbar from overlapping with the property panel.
   */
  toolbarMaxRight?: Ref<number | undefined>
  /**
   * Optional reactive ref indicating the current drag-over is forbidden.
   * When true and dragOverNodeId is 'root', the forbidden overlay is shown
   * instead of the drop indicator.
   * Managed externally by the designer package.
   */
  isForbidden?: Ref<boolean>
}

/**
 * Internal context provided to all renderer descendants via provide/inject.
 */
export interface RendererContext {
  engine: DesignerEngine
  componentMap: ComponentMap
  extensions: RendererExtensions
  eventHooks: RendererEventHooks
  actionRegistry: NodeActionRegistry
  dragOverNodeId: Ref<string | null>
  /** Optional max right boundary for toolbar positioning (viewport px). */
  toolbarMaxRight?: Ref<number | undefined>
}

/**
 * Injection key for the renderer context.
 */
export const RENDERER_CONTEXT_KEY: InjectionKey<RendererContext> = Symbol('dc-renderer')

// ──────────────────────────────────────────
// Node interaction state
// ──────────────────────────────────────────

/**
 * Reactive interaction state computed for a single node.
 * Returned by the useNodeState composable.
 */
export interface NodeInteractionState {
  isSelected: ComputedRef<boolean>
  isHovered: ComputedRef<boolean>
  isDragOver: ComputedRef<boolean>
  /** CSS class map for binding: { 'dc-node--selected': true, ... } */
  interactionClasses: ComputedRef<Record<string, boolean>>
}
