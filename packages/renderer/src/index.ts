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
export { useNodeActions, useNodeDrag, useNodeState, useWidgetNode } from './composables'
export type { UseNodeActionsReturn } from './composables'
export type { UseNodeDragReturn } from './composables'
export type { UseWidgetNodeReturn } from './composables'

// ── Context ──────────────────────────────
export { createRendererContext, useRendererContext } from './context'

// ── Event Hooks ─────────────────────────
export { createDefaultEventHooks } from './event-hooks'
export type {
  DeleteHookPayload,
  DragHookPayload,
  HoverHookPayload,
  MoveHookPayload,
  RendererEventHooks,
  SelectHookPayload,
} from './event-hooks'

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
  WidgetFallbackProps,
} from './types'
export { RENDERER_CONTEXT_KEY } from './types'
