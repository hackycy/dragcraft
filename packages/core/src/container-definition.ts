import type {
  ContainerDefinition,
  ContainerDefinitionValidationError,
  ContainerDefinitionValidationResult,
} from './types'

const RESERVED_IDS = new Set(['__proto__', 'prototype', 'constructor'])

export function validateContainerDefinition(definition: ContainerDefinition): ContainerDefinitionValidationResult {
  const errors: ContainerDefinitionValidationError[] = []
  if (!Object.hasOwn(definition.variants, definition.defaultVariant))
    errors.push({ code: 'CONTAINER_DEFAULT_VARIANT_MISSING', path: 'defaultVariant' })

  for (const [variantId, variant] of Object.entries(definition.variants)) {
    if (!variantId || RESERVED_IDS.has(variantId))
      errors.push({ code: 'CONTAINER_VARIANT_ID_RESERVED', path: `variants.${variantId}` })
    const seen = new Set<string>()
    for (const [index, region] of variant.regions.entries()) {
      const path = `variants.${variantId}.regions.${index}`
      if (!region.id || RESERVED_IDS.has(region.id))
        errors.push({ code: 'CONTAINER_REGION_ID_RESERVED', path })
      if (seen.has(region.id))
        errors.push({ code: 'CONTAINER_REGION_ID_DUPLICATE', path })
      seen.add(region.id)
      const { minItems = 0, maxItems = Number.POSITIVE_INFINITY } = region.constraints ?? {}
      const maxItemsInvalid = region.constraints?.maxItems !== undefined
        && (!Number.isInteger(maxItems) || maxItems < 0)
      if (!Number.isInteger(minItems) || minItems < 0 || maxItemsInvalid || minItems > maxItems)
        errors.push({ code: 'CONTAINER_CARDINALITY_INVALID', path: `${path}.constraints` })
      for (const [listName, typeIds] of Object.entries({
        includeTypes: region.constraints?.includeTypes ?? [],
        excludeTypes: region.constraints?.excludeTypes ?? [],
      })) {
        if (typeIds.some(typeId => typeof typeId !== 'string' || typeId.length === 0))
          errors.push({ code: 'CONTAINER_TYPE_ID_INVALID', path: `${path}.constraints.${listName}` })
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
