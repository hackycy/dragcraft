import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'

/**
 * Reactive interaction state computed for a single field.
 */
export interface FieldState {
  isVisible: ComputedRef<boolean>
  isDisabled: ComputedRef<boolean>
}

/**
 * Computes reactive visibility and disabled state for a given field.
 * Evaluates the field's `visible` and `disabled` predicates against the current form values.
 */
export function useFieldState(
  field: FieldSchema,
  ctx: FormGeneratorContext,
): FieldState {
  const isVisible = computed(() => {
    if (!field.visible)
      return true
    return field.visible({ values: ctx.values })
  })

  const isDisabled = computed(() => {
    if (ctx.disabled.value)
      return true
    if (!field.disabled)
      return false
    return field.disabled({ values: ctx.values })
  })

  return { isVisible, isDisabled }
}
