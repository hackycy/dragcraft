import type {
  ContainerDefinition,
  ContainerDefinitionValidationError,
  ContainerDefinitionValidationResult,
} from './types'

const RESERVED_IDS = new Set(['__proto__', 'prototype', 'constructor'])

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function validateContainerDefinition(definition: ContainerDefinition): ContainerDefinitionValidationResult {
  const errors: ContainerDefinitionValidationError[] = []
  if (!isRecord(definition)) {
    return { valid: false, errors: [{ code: 'CONTAINER_DEFINITION_INVALID', path: '' }] }
  }

  const variants = definition.variants
  if (!isRecord(variants)) {
    return { valid: false, errors: [{ code: 'CONTAINER_VARIANTS_INVALID', path: 'variants' }] }
  }
  if (typeof definition.defaultVariant !== 'string'
    || !Object.hasOwn(variants, definition.defaultVariant)) {
    errors.push({ code: 'CONTAINER_DEFAULT_VARIANT_MISSING', path: 'defaultVariant' })
  }

  for (const [variantId, variantValue] of Object.entries(variants)) {
    const variantPath = `variants.${variantId}`
    if (!variantId || RESERVED_IDS.has(variantId))
      errors.push({ code: 'CONTAINER_VARIANT_ID_RESERVED', path: variantPath })
    if (!isRecord(variantValue)) {
      errors.push({ code: 'CONTAINER_VARIANT_INVALID', path: variantPath })
      continue
    }
    if (!Array.isArray(variantValue.regions)) {
      errors.push({ code: 'CONTAINER_REGIONS_INVALID', path: `${variantPath}.regions` })
      continue
    }

    const seen = new Set<string>()
    for (const [index, regionValue] of variantValue.regions.entries()) {
      const path = `${variantPath}.regions.${index}`
      if (!isRecord(regionValue)) {
        errors.push({ code: 'CONTAINER_REGION_INVALID', path })
        continue
      }
      const regionId = regionValue.id
      if (typeof regionId !== 'string' || !regionId || RESERVED_IDS.has(regionId))
        errors.push({ code: 'CONTAINER_REGION_ID_RESERVED', path })
      if (typeof regionId === 'string' && seen.has(regionId))
        errors.push({ code: 'CONTAINER_REGION_ID_DUPLICATE', path })
      if (typeof regionId === 'string')
        seen.add(regionId)

      const constraints = regionValue.constraints
      if (constraints !== undefined && !isRecord(constraints)) {
        errors.push({ code: 'CONTAINER_CONSTRAINTS_INVALID', path: `${path}.constraints` })
        continue
      }
      const minItems = constraints?.minItems ?? 0
      const maxItems = constraints?.maxItems ?? Number.POSITIVE_INFINITY
      const maxItemsInvalid = constraints?.maxItems !== undefined
        && (!Number.isInteger(maxItems) || (maxItems as number) < 0)
      if (!Number.isInteger(minItems)
        || (minItems as number) < 0
        || maxItemsInvalid
        || (minItems as number) > (maxItems as number)) {
        errors.push({ code: 'CONTAINER_CARDINALITY_INVALID', path: `${path}.constraints` })
      }
      for (const listName of ['includeTypes', 'excludeTypes'] as const) {
        const typeIds = constraints?.[listName]
        if (typeIds !== undefined
          && (!Array.isArray(typeIds)
            || typeIds.some(typeId => typeof typeId !== 'string' || typeId.length === 0))) {
          errors.push({ code: 'CONTAINER_TYPE_ID_INVALID', path: `${path}.constraints.${listName}` })
        }
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
