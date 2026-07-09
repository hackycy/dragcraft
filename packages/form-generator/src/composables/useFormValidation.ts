import type { Ref } from 'vue'
import type { FieldSchema, FormContext, FormSchema, ValidationError } from '../types'
import { ref } from 'vue'
import { createFormContext, evaluateBoolean } from '../utils'

/**
 * Form-level validation interface.
 */
export interface FormValidation {
  /** Reactive map of field key -> error message (undefined = no error) */
  fieldErrors: Ref<Record<string, string | undefined>>
  /** Validate a single field by key. Optionally pass a resolved field for dependency-driven rules. */
  validateField: (key: string, resolvedField?: FieldSchema) => string | undefined
  /** Validate all fields. Returns array of errors (empty = all valid). */
  validateAll: () => ValidationError[]
  /** Clear all validation errors */
  clearErrors: () => void
}

type FormSchemaSource = FormSchema | (() => FormSchema)

function resolveSchema(schema: FormSchemaSource): FormSchema {
  return typeof schema === 'function' ? schema() : schema
}

function createFieldIndex(schema: FormSchema): Map<string, FieldSchema> {
  const index = new Map<string, FieldSchema>()

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (index.has(field.key)) {
        console.warn(`[dragcraft/form-generator] Duplicate field key "${field.key}" found in schema.`)
      }
      index.set(field.key, field)
    }
  }

  return index
}

export function findFieldSchema(schema: FormSchema, key: string): FieldSchema | undefined {
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

function shouldValidateField(field: FieldSchema, formCtx: FormContext): boolean {
  const visible = field.ifShow !== undefined ? field.ifShow : field.visible
  return evaluateBoolean(visible, formCtx, true) && evaluateBoolean(field.show, formCtx, true)
}

function runFieldValidation(
  field: FieldSchema,
  value: unknown,
  formCtx: FormContext,
): string | undefined {
  if (!field.rules || field.rules.length === 0)
    return undefined

  for (const rule of field.rules) {
    // Required check (supports static boolean or dynamic predicate)
    const isRequired = typeof rule.required === 'function'
      ? rule.required(formCtx)
      : rule.required
    if (isRequired && isEmptyValue(value)) {
      return rule.message ?? 'This field is required'
    }

    // min (number only)
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      return rule.message ?? `Value must be at least ${rule.min}`
    }

    // max (number only)
    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      return rule.message ?? `Value must be at most ${rule.max}`
    }

    // minLength (string only)
    if (rule.minLength !== undefined && typeof value === 'string' && value.length < rule.minLength) {
      return rule.message ?? `Must be at least ${rule.minLength} characters`
    }

    // maxLength (string only)
    if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
      return rule.message ?? `Must be at most ${rule.maxLength} characters`
    }

    // pattern (string only)
    if (rule.pattern && typeof value === 'string') {
      rule.pattern.lastIndex = 0
      if (!rule.pattern.test(value))
        return rule.message ?? 'Invalid format'
    }

    // enum
    if (rule.enum && !rule.enum.includes(value)) {
      return rule.message ?? `Must be one of: ${rule.enum.join(', ')}`
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
  schema: FormSchemaSource,
  getValues: () => Record<string, unknown>,
  resolveField?: (key: string) => FieldSchema | undefined,
): FormValidation {
  const fieldErrors = ref<Record<string, string | undefined>>({})
  const currentSchema = () => resolveSchema(schema)
  let cachedSchema: FormSchema | undefined
  let cachedFieldIndex = new Map<string, FieldSchema>()

  const getFieldIndex = () => {
    const schema = currentSchema()
    if (schema !== cachedSchema) {
      cachedSchema = schema
      cachedFieldIndex = createFieldIndex(schema)
    }
    return cachedFieldIndex
  }

  const validateField = (key: string, resolvedField?: FieldSchema): string | undefined => {
    const field = resolvedField ?? getFieldIndex().get(key)
    if (!field)
      return undefined

    const values = getValues()
    const value = values[key]
    const formCtx: FormContext = createFormContext(values)
    if (!shouldValidateField(field, formCtx)) {
      fieldErrors.value = { ...fieldErrors.value, [key]: undefined }
      return undefined
    }

    const error = runFieldValidation(field, value, formCtx)

    fieldErrors.value = { ...fieldErrors.value, [key]: error }
    return error
  }

  const validateAll = (): ValidationError[] => {
    const errors: ValidationError[] = []
    const values = getValues()
    const formCtx: FormContext = createFormContext(values)
    const newFieldErrors: Record<string, string | undefined> = {}

    for (const section of currentSchema().sections) {
      for (const field of section.fields) {
        const resolved = resolveField?.(field.key) ?? field
        const value = values[resolved.key]
        if (!shouldValidateField(resolved, formCtx)) {
          newFieldErrors[resolved.key] = undefined
          continue
        }

        const error = runFieldValidation(resolved, value, formCtx)
        newFieldErrors[resolved.key] = error
        if (error) {
          errors.push({ key: resolved.key, message: error })
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
