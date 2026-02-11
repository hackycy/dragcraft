import type { ComputedRef, Ref } from 'vue'
import type { FormFieldSchema, FormSchema, ValidationResult } from './types'
import { computed, ref, toValue } from 'vue'
import { resolveDefaults } from './defaults'
import { validateField } from './validation'

export interface UseFormOptions {
  schema: Ref<FormSchema> | FormSchema
  modelValue: Ref<Record<string, any>>
  disabled?: Ref<boolean>
}

export interface UseFormReturn {
  visibleFields: ComputedRef<FormFieldSchema[]>
  getFieldValue: (key: string) => any
  setFieldValue: (key: string, value: any) => Record<string, any>
  getFieldError: (key: string) => string | null
  errors: ComputedRef<Record<string, string | null>>
  validate: () => ValidationResult
  isValid: ComputedRef<boolean>
  resolvedModel: ComputedRef<Record<string, any>>
}

export function useForm(options: UseFormOptions): UseFormReturn {
  const schema = computed(() => toValue(options.schema))
  const model = options.modelValue

  const resolvedModel = computed(() =>
    resolveDefaults(schema.value, model.value),
  )

  const visibleFields = computed(() =>
    schema.value.filter((field) => {
      if (typeof field.visible === 'function') {
        return field.visible(resolvedModel.value)
      }
      return field.visible !== false
    }),
  )

  const errors = computed(() => {
    const result: Record<string, string | null> = {}
    for (const field of schema.value) {
      result[field.key] = validateField(field, resolvedModel.value[field.key])
    }
    return result
  })

  const isValid = computed(() =>
    Object.values(errors.value).every(e => e === null),
  )

  function getFieldValue(key: string): any {
    return resolvedModel.value[key]
  }

  function setFieldValue(key: string, value: any): Record<string, any> {
    return { ...model.value, [key]: value }
  }

  function getFieldError(key: string): string | null {
    return errors.value[key] ?? null
  }

  function validate(): ValidationResult {
    const errs: Record<string, string> = {}
    for (const field of schema.value) {
      const error = validateField(field, resolvedModel.value[field.key])
      if (error) {
        errs[field.key] = error
      }
    }
    return { valid: Object.keys(errs).length === 0, errors: errs }
  }

  return {
    visibleFields,
    getFieldValue,
    setFieldValue,
    getFieldError,
    errors,
    validate,
    isValid,
    resolvedModel,
  }
}
