import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'

/**
 * Reactive interaction state computed for a single field.
 */
export interface FieldState {
  /** Whether the field should be rendered in the DOM (ifShow / visible). */
  isVisible: ComputedRef<boolean>
  /** Whether the field should be visually displayed (show -- CSS visibility). */
  isShown: ComputedRef<boolean>
  /** Whether the field is disabled. */
  isDisabled: ComputedRef<boolean>
}

/**
 * Computes reactive visibility, display, and disabled state for a given field.
 * Evaluates the field's predicates against the current form values.
 */
export function useFieldState(
  getField: () => FieldSchema,
  ctx: FormGeneratorContext,
): FieldState {
  // ifShow takes precedence over visible (backward compat alias)
  const isVisible = computed(() => {
    const field = getField()
    if (field.ifShow !== undefined) {
      if (typeof field.ifShow === 'function')
        return field.ifShow({ values: ctx.values })
      return field.ifShow
    }
    if (field.visible !== undefined) {
      if (typeof field.visible === 'function')
        return field.visible({ values: ctx.values })
      return field.visible
    }
    return true
  })

  const isShown = computed(() => {
    const field = getField()
    if (field.show === undefined)
      return true
    if (typeof field.show === 'function')
      return field.show({ values: ctx.values })
    return field.show
  })

  const isDisabled = computed(() => {
    const field = getField()
    if (ctx.disabled.value)
      return true
    if (!field.disabled)
      return false
    return field.disabled({ values: ctx.values })
  })

  return { isVisible, isShown, isDisabled }
}
