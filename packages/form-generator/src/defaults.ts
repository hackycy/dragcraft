import type { FormSchema } from './types'

export function resolveDefaults(
  schema: FormSchema,
  currentValues: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = { ...currentValues }
  for (const field of schema) {
    if (!(field.key in result) && field.defaultValue !== undefined) {
      result[field.key] = field.defaultValue
    }
  }
  return result
}
