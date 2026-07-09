import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'
import { resolveFieldDependencies } from '../utils'

export interface FieldDependenciesResult {
  resolvedField: ComputedRef<FieldSchema>
}

type FieldSource = FieldSchema | (() => FieldSchema)

function resolveFieldSource(field: FieldSource): FieldSchema {
  return typeof field === 'function' ? field() : field
}

function createDependencySnapshot(
  field: FieldSchema,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {}
  for (const key of field.dependencies?.fields ?? []) {
    snapshot[key] = values[key]
  }
  return snapshot
}

/**
 * Resolves dynamic field schema overrides driven by explicit field dependencies.
 * When a field declares `dependencies`, this composable watches those fields
 * and merges the handler's return into a resolved FieldSchema.
 */
export function useFieldDependencies(
  field: FieldSource,
  ctx: FormGeneratorContext,
): FieldDependenciesResult {
  const resolvedField = computed<FieldSchema>(() => {
    const currentField = resolveFieldSource(field)
    if (!currentField.dependencies)
      return currentField

    return resolveFieldDependencies(
      currentField,
      createDependencySnapshot(currentField, ctx.values),
      ctx.getFieldValue(currentField.key),
    )
  })

  return { resolvedField }
}
