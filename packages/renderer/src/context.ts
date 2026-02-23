import type { RendererContext, RendererOptions } from './types'
import { inject, ref } from 'vue'
import { RENDERER_CONTEXT_KEY } from './types'

/**
 * Creates a RendererContext from options.
 * Called internally by RootRenderer.
 */
export function createRendererContext(options: RendererOptions): RendererContext {
  return {
    engine: options.engine,
    componentMap: options.componentMap,
    extensions: options.extensions ?? {},
    dragOverNodeId: options.dragOverNodeId ?? ref(null),
  }
}

/**
 * Injects the RendererContext from the nearest ancestor RootRenderer.
 * Throws if called outside the renderer component tree.
 */
export function useRendererContext(): RendererContext {
  const ctx = inject(RENDERER_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/renderer] RendererContext not found. '
      + 'Ensure this component is a descendant of RootRenderer.',
    )
  }
  return ctx
}
