import type { FormFieldSchema } from './types'

export function validateField(
  field: FormFieldSchema,
  value: any,
): string | null {
  if (field.required) {
    if (value === undefined || value === null || value === '') {
      return `${field.label} is required`
    }
  }

  if (field.validator) {
    const result = field.validator(value)
    if (result === false) {
      return `${field.label} is invalid`
    }
    if (typeof result === 'string') {
      return result
    }
  }

  return null
}
