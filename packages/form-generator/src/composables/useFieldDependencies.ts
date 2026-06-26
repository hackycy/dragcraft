import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'

export interface FieldDependenciesResult {
  resolvedField: ComputedRef<FieldSchema>
}

/**
 * Resolves dynamic field schema overrides driven by explicit field dependencies.
 * When a field declares `dependencies`, this composable watches those fields
 * and merges the handler's return into a resolved FieldSchema.
 */
export function useFieldDependencies(
  field: FieldSchema,
  ctx: FormGeneratorContext,
): FieldDependenciesResult {
  const resolvedField = computed<FieldSchema>(() => {
    if (!field.dependencies)
      return field

    const form = { ...ctx.values }
    const fieldValue = ctx.getFieldValue(field.key)
    const overrides = field.dependencies.handler(form, fieldValue)

    return {
      ...field,
      ...overrides,
      key: field.key,
      component: field.component,
      dependencies: field.dependencies,
    }
  })

  return { resolvedField }
}
