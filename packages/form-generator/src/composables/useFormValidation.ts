import type { Ref } from 'vue'
import type { FieldSchema, FormContext, FormSchema, ValidationError } from '../types'
import { ref } from 'vue'

/**
 * Form-level validation interface.
 */
export interface FormValidation {
  /** Reactive map of field key -> error message (undefined = no error) */
  fieldErrors: Ref<Record<string, string | undefined>>
  /** Validate a single field by key. Returns error message or undefined. */
  validateField: (key: string) => string | undefined
  /** Validate all fields. Returns array of errors (empty = all valid). */
  validateAll: () => ValidationError[]
  /** Clear all validation errors */
  clearErrors: () => void
}

function findFieldSchema(schema: FormSchema, key: string): FieldSchema | undefined {
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.key === key)
        return field
    }
  }
  return undefined
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

function runFieldValidation(
  field: FieldSchema,
  value: unknown,
  formCtx: FormContext,
): string | undefined {
  if (!field.rules || field.rules.length === 0)
    return undefined

  for (const rule of field.rules) {
    // Required check
    if (rule.required && isEmptyValue(value)) {
      return rule.message ?? 'This field is required'
    }

    // Custom validator
    if (rule.validator) {
      const result = rule.validator(value, formCtx)
      if (typeof result === 'string')
        return result
      if (result === false)
        return rule.message ?? 'Validation failed'
    }
  }

  return undefined
}

/**
 * Creates a form-level validation system.
 * Validates fields against their rules and tracks errors reactively.
 */
export function useFormValidation(
  schema: FormSchema,
  getValues: () => Record<string, unknown>,
): FormValidation {
  const fieldErrors = ref<Record<string, string | undefined>>({})

  const validateField = (key: string): string | undefined => {
    const field = findFieldSchema(schema, key)
    if (!field)
      return undefined

    const values = getValues()
    const value = values[key]
    const formCtx: FormContext = { values }
    const error = runFieldValidation(field, value, formCtx)

    fieldErrors.value = { ...fieldErrors.value, [key]: error }
    return error
  }

  const validateAll = (): ValidationError[] => {
    const errors: ValidationError[] = []
    const values = getValues()
    const formCtx: FormContext = { values }
    const newFieldErrors: Record<string, string | undefined> = {}

    for (const section of schema.sections) {
      for (const field of section.fields) {
        const value = values[field.key]
        const error = runFieldValidation(field, value, formCtx)
        newFieldErrors[field.key] = error
        if (error) {
          errors.push({ key: field.key, message: error })
        }
      }
    }

    fieldErrors.value = newFieldErrors
    return errors
  }

  const clearErrors = (): void => {
    fieldErrors.value = {}
  }

  return { fieldErrors, validateField, validateAll, clearErrors }
}
