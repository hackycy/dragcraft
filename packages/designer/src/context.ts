import type { DesignerContext } from './types'
import { inject } from 'vue'
import { DESIGNER_CONTEXT_KEY } from './types'

/**
 * Injects the DesignerContext from the nearest ancestor DcDesigner.
 * Throws if called outside the designer component tree.
 */
export function useDesignerContext(): DesignerContext {
  const ctx = inject(DESIGNER_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/designer] DesignerContext not found. '
      + 'Ensure this component is a descendant of DcDesigner.',
    )
  }
  return ctx
}
