import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'
import { createFormContext, evaluateBoolean } from '../utils'

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
  const getFormContext = () => createFormContext(ctx.values)

  // ifShow takes precedence over visible (backward compat alias)
  const isVisible = computed(() => {
    const field = getField()
    const visible = field.ifShow !== undefined ? field.ifShow : field.visible
    return evaluateBoolean(visible, getFormContext(), true)
  })

  const isShown = computed(() => {
    const field = getField()
    return evaluateBoolean(field.show, getFormContext(), true)
  })

  const isDisabled = computed(() => {
    const field = getField()
    if (ctx.disabled.value)
      return true
    if (!field.disabled)
      return false
    return evaluateBoolean(field.disabled, getFormContext(), false)
  })

  return { isVisible, isShown, isDisabled }
}
