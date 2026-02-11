import type { ComputedRef, Ref } from 'vue'
import type { FormFieldSchema } from './types'
import { computed } from 'vue'
import { validateField } from './validation'

export interface UseFormFieldReturn {
  isVisible: ComputedRef<boolean>
  isDisabled: ComputedRef<boolean>
  error: ComputedRef<string | null>
}

export function useFormField(
  field: FormFieldSchema,
  model: Ref<Record<string, any>>,
  globalDisabled: Ref<boolean>,
): UseFormFieldReturn {
  const isVisible = computed(() => {
    if (typeof field.visible === 'function') {
      return field.visible(model.value)
    }
    return field.visible !== false
  })

  const isDisabled = computed(() => {
    return globalDisabled.value || field.disabled === true
  })

  const error = computed(() => {
    const value = model.value[field.key]
    return validateField(field, value)
  })

  return { isVisible, isDisabled, error }
}
