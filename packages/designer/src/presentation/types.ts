import type { DeepReadonly as CoreDeepReadonly, DocumentSchema, NodeDefinition } from '@dragcraft/core'
import type { Component, ComputedRef, InjectionKey, Ref } from 'vue'
import type { MaterialDefinition } from '../materials/types'
import type { DesignerSession } from '../session/types'
import type { NodeActionRegistry, ResolvedNodeAction } from './action-registry'
import type { ActionInterceptor } from './action-runtime'
import type { NodeToolbarOrientation } from './node-interaction'
import type { NodeSelectionPlane, NodeSelectionProjection } from './selection-presentation'
import type { CreationBlockReason, DragTarget, NodeDestination, NodeOwner, NodeStyle, PlacementDecision } from './semantic'

export interface PresentationNode {
  readonly id: string
  readonly type: string
  readonly props: Record<string, unknown>
  readonly style?: Record<string, unknown>
}

export type DeepReadonly<T>
  = T extends (...args: infer Args) => infer Result
    ? (...args: Args) => Result
    : T extends readonly unknown[]
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T extends object
        ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
        : T

// ──────────────────────────────────────────
// Component resolution
// ──────────────────────────────────────────

/**
 * Maps a node's `type` string to a Vue component.
 *
 * Example: { button: ButtonWidget, text: TextWidget }
 */
export interface NodeHostProps {
  node: NodeDefinition
  owner?: NodeOwner
  /** Internal coordinate plane inherited by nested container nodes. */
  selectionPlane?: NodeSelectionPlane
}

export interface ContainerRegionOutletProps {
  regionId: string
  as?: string | Component
}

export interface ResolveContainerDropIndexContext {
  event: DragEvent
  regionElement: HTMLElement
  itemElements: readonly HTMLElement[]
  nodes: DeepReadonly<PresentationNode[]>
}

export type ResolveContainerDropIndex = (ctx: ResolveContainerDropIndexContext) => number | null

export interface ContainerRegionOutletDropProps extends ContainerRegionOutletProps {
  resolveDropIndex?: ResolveContainerDropIndex
}

export interface ContainerDropTarget {
  event: DragEvent
  destination: Extract<NodeDestination, { kind: 'container' }>
}

export interface ContainerDropRejection {
  event: DragEvent
  containerId: string
  regionId: string
  allowed: false
  code: 'CONTAINER_DROP_ADAPTER_MISSING' | 'CONTAINER_DROP_ADAPTER_FAILED' | 'CONTAINER_DROP_ADAPTER_INVALID' | 'CONTAINER_DROP_NO_TARGET'
  message?: string
}

/** A declared Region projected from a material's Core container declaration. */
export interface PresentationRegionDefinition {
  readonly id: string
  readonly title: string
  readonly titleKey?: string
  readonly constraints?: {
    readonly includeTypes?: readonly string[]
    readonly excludeTypes?: readonly string[]
    readonly minItems?: number
    readonly maxItems?: number
  }
}

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
  /** Structural owner that determines the default interaction presentation. */
  owner: NodeOwner
  /** Reactive interaction state */
  state: NodeInteractionState
  /** The resolved widget meta, if available */
  material: Readonly<MaterialDefinition> | undefined
}

/**
 * Closed authoring intents shared by the Designer UI and Application Surface.
 * Implementations translate these intents to their active backend privately.
 */
export type AuthoringAction
  = | { type: 'history.undo' }
    | { type: 'history.redo' }
    | { type: 'selection.set', nodeId: string | null }
    | { type: 'hover.set', nodeId: string | null }
    | { type: 'drag.set', target: DragTarget | null }
    | { type: 'node.add', node: NodeDefinition, destination?: NodeDestination }
    | { type: 'node.move', nodeId: string, destination: NodeDestination }
    | { type: 'node.remove', nodeId: string }
    | { type: 'node.duplicate', nodeId: string }
    | { type: 'node.update', nodeId: string, props: Record<string, unknown>, style?: NodeStyle }
    | { type: 'page.update', props: Record<string, unknown>, style?: NodeStyle }
    | { type: 'global-config.update', config: Record<string, unknown> }
    | { type: 'schema.import', schema: DocumentSchema }

export interface AuthoringDecision extends CreationBlockReason {
  allowed: boolean
  details?: Record<string, unknown>
}

export type AuthoringResult
  = | { ok: true, changed: boolean, eventPayload?: unknown }
    | ({ ok: false, code: string } & CreationBlockReason & { details?: Record<string, unknown> })

/**
 * Viewport-relative position coordinates for floating toolbar.
 * When provided, the toolbar uses position: fixed to escape overflow clipping.
 */
export interface ToolbarPositionData {
  /** CSS x coordinate in pixels (viewport-relative). */
  x: number
  /** CSS y coordinate in pixels (viewport-relative). */
  y: number
  /** Resolved placement after collision handling. */
  placement: 'left-start' | 'top-end' | 'bottom-end'
  /** Action layout direction for the resolved owner presentation. */
  orientation: NodeToolbarOrientation
  /** Positioning strategy used by the interaction layer. */
  strategy: 'fixed'
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
  /** Structural owner that determines the default interaction presentation. */
  owner: NodeOwner
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
  /** Structural owner that determines the default interaction presentation. */
  owner: NodeOwner
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
  /** Structural owner that determines the default interaction presentation. */
  owner: NodeOwner
  /** Select handler to call on click */
  onSelect: (e: MouseEvent) => void
}

/**
 * Props received by a custom nodeSelection component.
 * The Canvas Surface and Frame Boundary own geometry, plane routing,
 * and clipping; the component only owns the visual presentation.
 */
export interface NodeSelectionProps {
  /** The schema node ID */
  nodeId: string
  /** The widget type string */
  nodeType: string
  /** Structural owner that determines the projection kind. */
  owner: NodeOwner
  /** Presentation-owned material and semantic selection bounds in a coordinate plane. */
  projection: NodeSelectionProjection
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
  /** User-facing reason for the blocked creation attempt */
  reason: CreationBlockReason | null
}

/**
 * Props received by a custom materialFallback component.
 */
export interface MaterialFallbackProps {
  /** The schema node ID */
  nodeId: string
  /** The unresolved widget type string */
  nodeType: string
}

/** A stateless visual shell that renders its default slot exactly once. */
export type ContainerShell = Component

/** Static shells are concise; readonly refs let the host switch shells reactively. */
export type ContainerShellSource = ContainerShell | Readonly<Ref<ContainerShell>>

export interface ContainerDropApplicationSurfaceOptions {
  activeDestination?: Ref<NodeDestination | null>
  containerDropDecision?: Ref<PlacementDecision | null>
  onContainerDragOver?: (target: ContainerDropTarget | ContainerDropRejection) => void
  onContainerDragLeave?: (event: DragEvent) => void
  onContainerDrop?: (event: DragEvent) => void
}

/**
 * Options accepted by ApplicationSurface as props.
 *
 * **Immutability constraint:** These options are captured once when ApplicationSurface
 * mounts and provided to all descendants via provide/inject. Changing them after
 * the initial render has no effect on the running Application Surface. To swap
 * host integrations, remount ApplicationSurface with a different `key`.
 */
export interface ApplicationSurfaceOptions extends ContainerDropApplicationSurfaceOptions {
  /** Semantic read projection supplied by the Designer host. */
  session: DesignerSession
  /** Optional host-owned shell around the Application Surface. */
  containerShell?: ContainerShellSource
  /** Interceptors for node actions such as delete, move, duplicate, and custom actions */
  actionInterceptors?: ActionInterceptor[]
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
  /** Optional canvas viewport used as the collision boundary for floating controls. */
  interactionBoundary?: Ref<HTMLElement | null>
  /** Reactive Canvas stage scale used to restore interaction-plane coordinates. */
  viewScale?: Ref<number>
  /**
   * Optional reactive ref indicating the current drag-over is forbidden.
   * When true and dragOverNodeId is 'root', the forbidden overlay is shown
   * instead of the drop indicator.
   * Managed externally by the designer package.
   */
  isForbidden?: Ref<boolean>
  /** Optional reason explaining the current forbidden drag-over state. */
  forbiddenReason?: Ref<CreationBlockReason | null>
}

/**
 * Internal context provided to all Application Surface descendants via provide/inject.
 */
export interface PresentationContext extends ContainerDropApplicationSurfaceOptions {
  session: DesignerSession
  /** One canonical schema snapshot shared by the presentation tree for each session revision. */
  schema: ComputedRef<CoreDeepReadonly<DocumentSchema> | null>
  /** Resolves action geometry and lock constraints from revision-scoped caches. */
  resolveNodeActionPosition?: (node: PresentationNode, owner: NodeOwner) => {
    owner: NodeOwner
    index: number
    siblingCount: number
    lockedIndices: Set<number>
  }
  containerShell?: ContainerShellSource
  actionInterceptors: ActionInterceptor[]
  actionRegistry: NodeActionRegistry
  selectedNodeId: Ref<string | null>
  hoveredNodeId: Ref<string | null>
  dragOverNodeId: Ref<string | null>
  activeDestination: Ref<NodeDestination | null>
  containerDropDecision: Ref<PlacementDecision | null>
  /** Optional canvas viewport used as the collision boundary for floating controls. */
  interactionBoundary?: Ref<HTMLElement | null>
  /** Canvas stage scale shared by geometry that renders inside the scaled stage. */
  viewScale: Ref<number>
}

/**
 * Injection key for the Presentation context.
 */
export const PRESENTATION_CONTEXT_KEY: InjectionKey<PresentationContext> = Symbol('dc-presentation')

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
