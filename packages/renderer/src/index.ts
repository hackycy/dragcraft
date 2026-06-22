// ── Action Registry ─────────────────────
export { ActionKey, createDefaultActions, createNodeActionRegistry } from './action-registry'

export type {
  NodeActionContext,
  NodeActionDefinition,
  NodeActionRegistry,
  ResolvedNodeAction,
} from './action-registry'
// ── Components ───────────────────────────
export {
  DefaultContainerShell,
  DefaultDropIndicator,
  DefaultEmptyState,
  DefaultNodeHandle,
  DefaultNodeMask,
  DefaultNodeToolbar,
  DefaultWidgetFallback,
  RootRenderer,
  WidgetRenderer,
} from './components'

// ── Composables ──────────────────────────
export { useNodeActions, useNodeDrag, useNodeState, useToolbarPosition, useWidgetNode } from './composables'

export type { UseNodeActionsReturn } from './composables'
export type { UseNodeDragReturn } from './composables'
export type { UseToolbarPositionReturn } from './composables'
export type { UseWidgetNodeReturn } from './composables'
// ── Context ──────────────────────────────
export { createRendererContext, useRendererContext } from './context'

// ── Event Hooks ─────────────────────────
export { createDefaultEventHooks, fireAfterHook, resolveBeforeHook } from './event-hooks'

export type {
  DeleteHookPayload,
  DragHookPayload,
  HoverHookPayload,
  MaybePromise,
  MoveHookPayload,
  RendererEventHooks,
  SelectHookPayload,
} from './event-hooks'
// ── Messages ────────────────────────────
export { rendererMessages } from './messages'

// ── Types ────────────────────────────────
export type {
  ComponentMap,
  EmptyStateProps,
  NodeHandleProps,
  NodeInteractionState,
  NodeMaskProps,
  NodeToolbarProps,
  NodeWrapperProps,
  RendererContext,
  RendererExtensions,
  RendererOptions,
  ToolbarPositionData,
  WidgetFallbackProps,
} from './types'
export { RENDERER_CONTEXT_KEY } from './types'
