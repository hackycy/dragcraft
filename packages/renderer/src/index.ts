// ── Action Registry ─────────────────────
export { ActionKey, createDefaultActions, createNodeActionRegistry } from './action-registry'

export type {
  NodeActionContext,
  NodeActionDefinition,
  NodeActionRegistry,
  ResolvedNodeAction,
} from './action-registry'
export { createConfirmActionInterceptor, runActionPipeline } from './action-runtime'
export type {
  ActionConfirmRequest,
  ActionDecision,
  ActionInterceptor,
  ActionInvocation,
  ActionRisk,
  ConfirmActionInterceptorOptions,
} from './action-runtime'
// ── Components ───────────────────────────
export {
  ContainerRegionOutlet,
  DefaultContainerFallback,
  DefaultContainerShell,
  DefaultDropIndicator,
  DefaultEmptyState,
  DefaultForbiddenOverlay,
  DefaultNodeHandle,
  DefaultNodeMask,
  DefaultNodeSelection,
  DefaultNodeToolbar,
  DefaultWidgetFallback,
  RootRenderer,
  WidgetRenderer,
} from './components'

// ── Composables ──────────────────────────
export { useNodeActions, useNodeDrag, useNodeInteractionGeometry, useNodeSelectionProjection, useNodeState, useToolbarPosition, useWidgetNode } from './composables'

export type { NodeInteractionGeometry, NodeInteractionRect, UseNodeInteractionGeometryOptions, UseNodeInteractionGeometryReturn } from './composables'
export type { UseNodeSelectionProjectionOptions, UseNodeSelectionProjectionReturn } from './composables'
export type { UseNodeActionsReturn } from './composables'
export type { UseNodeDragReturn } from './composables'
export type { UseToolbarPositionReturn } from './composables'
export type { UseWidgetNodeReturn } from './composables'
// ── Container Runtime ────────────────────
export { CONTAINER_RUNTIME_CONTEXT_KEY, createContainerRuntime, useContainerRuntime } from './container-runtime'

export type { ContainerRuntime } from './container-runtime'
// ── Context ──────────────────────────────
export { createRendererContext, useRendererContext } from './context'

// ── Event Hooks ─────────────────────────
export { createDefaultEventHooks, fireAfterHook, resolveBeforeHook } from './event-hooks'

export type {
  DragHookPayload,
  HoverHookPayload,
  MaybePromise,
  RendererEventHooks,
  SelectHookPayload,
} from './event-hooks'
// ── Messages ────────────────────────────
export { rendererMessages } from './messages'

// ── Node Interaction ─────────────────────
export { resolveNodeInteractionPresentation } from './node-interaction'
export type { NodeInteractionGeometryMode, NodeInteractionPresentation, NodeToolbarOrientation, NodeToolbarPlacement } from './node-interaction'

// ── Selection Presentation ───────────────
export {
  createNodeSelectionPresentation,
  NODE_SELECTION_PLANE_KEY,
  NODE_SELECTION_PRESENTATION_KEY,
  useNodeSelectionPresentation,
} from './selection-presentation'
export type {
  NodeSelectionPlane,
  NodeSelectionPresentation,
  NodeSelectionPresentationHost,
  NodeSelectionProjection,
  NodeSelectionProjectionKind,
  NodeSelectionRect,
} from './selection-presentation'

// ── Types ────────────────────────────────
export type {
  ComponentMap,
  ContainerDropRejection,
  ContainerDropRendererOptions,
  ContainerDropTarget,
  ContainerRegionOutletDropProps,
  ContainerRegionOutletProps,
  DeepReadonly,
  EmptyStateProps,
  ForbiddenOverlayProps,
  NodeHandleProps,
  NodeInteractionState,
  NodeMaskProps,
  NodeSelectionProps,
  NodeToolbarProps,
  NodeWrapperProps,
  RendererContainerAdapter,
  RendererContext,
  RendererExtensions,
  RendererOptions,
  RendererWidgetActionExtra,
  RendererWidgetMeta,
  ResolveContainerDropIndex,
  ResolveContainerDropIndexContext,
  ToolbarPositionData,
  WidgetActionConfig,
  WidgetFallbackProps,
  WidgetRendererProps,
} from './types'
export { RENDERER_CONTEXT_KEY } from './types'

// ── Widget Runtime ───────────────────────
export { useWidgetRuntime, WIDGET_RUNTIME_CONTEXT_KEY } from './widget-runtime'
export type { WidgetRuntimeContext } from './widget-runtime'
