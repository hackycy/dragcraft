import type { FormGeneratorContext } from './types'
import { inject } from 'vue'
import { FORM_GENERATOR_CONTEXT_KEY } from './types'

/**
 * Injects the FormGeneratorContext from the nearest ancestor FormGenerator.
 * Throws if called outside a FormGenerator tree.
 */
export function useFormGeneratorContext(): FormGeneratorContext {
  const ctx = inject(FORM_GENERATOR_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      '[dragcraft/form-generator] FormGeneratorContext not found. '
      + 'Ensure this component is a descendant of FormGenerator.',
    )
  }
  return ctx
}
