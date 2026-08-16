import type { DeepReadonly, NodeDefinition } from '@dragcraft/core'
import type { DesignerSession } from '../session/types'
import type { PresentationNode, PresentationRegionDefinition } from './types'

export function resolveContainerRegions(
  session: DesignerSession,
  node: DeepReadonly<NodeDefinition> | PresentationNode,
): readonly PresentationRegionDefinition[] {
  const declaration = session.materials.get(node.type)?.schema?.container
  const isReadOnly = session.document.isNodeReadOnly(node.id)
  const regionIds = isReadOnly || !declaration
    ? session.document.getRegionIds(node.id)
    : declaration.regions.map(region => region.id)
  if (regionIds.length === 0)
    return []
  return regionIds.map((regionId) => {
    const declarationRegion = !isReadOnly
      ? declaration?.regions.find(region => region.id === regionId)
      : undefined
    return {
      id: regionId,
      title: regionId,
      ...(declarationRegion?.accepts || declarationRegion?.cardinality
        ? {
            constraints: {
              ...(declarationRegion?.accepts?.types ? { includeTypes: [...declarationRegion.accepts.types] } : {}),
              ...(declarationRegion?.cardinality?.min === undefined ? {} : { minItems: declarationRegion.cardinality.min }),
              ...(declarationRegion?.cardinality?.max === undefined ? {} : { maxItems: declarationRegion.cardinality.max }),
            },
          }
        : {}),
    }
  })
}
