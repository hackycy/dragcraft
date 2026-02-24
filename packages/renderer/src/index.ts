// ── Components ───────────────────────────
export {
  DefaultContainerShell,
  DefaultDropIndicator,
  DefaultWidgetFallback,
  RootRenderer,
  WidgetRenderer,
} from './components'

// ── Composables ──────────────────────────
export { useNodeState } from './composables'

// ── Context ──────────────────────────────
export { createRendererContext, useRendererContext } from './context'

// ── Types ────────────────────────────────
export type {
  ComponentMap,
  NodeInteractionState,
  RendererContext,
  RendererExtensions,
  RendererOptions,
} from './types'
export { RENDERER_CONTEXT_KEY } from './types'
