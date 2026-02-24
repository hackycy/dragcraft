import type { DesignerEngine } from '@dragcraft/core'
import type { Component, ComputedRef, InjectionKey, Ref } from 'vue'

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
}

// ──────────────────────────────────────────
// Renderer options and context
// ──────────────────────────────────────────

/**
 * Options accepted by RootRenderer as props.
 */
export interface RendererOptions {
  /** The core engine instance (read-only consumption) */
  engine: DesignerEngine
  /** Maps node.type -> Vue component for rendering */
  componentMap: ComponentMap
  /** Optional extension point overrides */
  extensions?: RendererExtensions
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
}

/**
 * Internal context provided to all renderer descendants via provide/inject.
 */
export interface RendererContext {
  engine: DesignerEngine
  componentMap: ComponentMap
  extensions: RendererExtensions
  dragOverNodeId: Ref<string | null>
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
