import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'
import { resolveFieldDependencies } from '../utils'

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
    return resolveFieldDependencies(field, ctx.values, ctx.getFieldValue(field.key))
  })

  return { resolvedField }
}
