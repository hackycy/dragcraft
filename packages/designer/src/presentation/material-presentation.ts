import type { DeepReadonly, NodeDefinition } from '@dragcraft/core'
import type { MaterialPresentationLayout } from '../materials/types'
import type { DesignerSession } from '../session/types'
import type { ResolvedPresentationLayout } from './semantic'
import type { PresentationNode, PresentationRegionDefinition } from './types'

export function resolvePresentationLayout(layout: MaterialPresentationLayout | undefined): ResolvedPresentationLayout {
  const placement = layout?.placement
  if (!placement || placement.kind === 'flow') {
    const region = placement?.region ?? 'content'
    const sortScope = placement?.sortScope === undefined
      ? region === 'content' ? 'content' : false
      : placement.sortScope
    return {
      placement: { kind: 'flow', region, sortScope },
      region,
      sortScope,
      ...(layout?.order === undefined ? {} : { order: layout.order }),
      visible: layout?.visible ?? true,
    }
  }
  if (placement.kind === 'chrome') {
    return {
      placement: {
        kind: 'chrome',
        edge: placement.edge,
        position: placement.position ?? 'fixed',
        reserve: {
          mode: placement.reserve?.mode ?? 'measure',
          ...(placement.reserve?.size === undefined ? {} : { size: placement.reserve.size }),
        },
        avoidContent: placement.avoidContent ?? true,
      },
      sortScope: false,
      ...(layout?.order === undefined ? {} : { order: layout.order }),
      visible: layout?.visible ?? true,
    }
  }
  return {
    placement: {
      kind: 'layer',
      layer: placement.layer ?? 'float',
      mode: placement.mode ?? (placement.anchor ? 'framework' : 'self'),
      anchor: placement.anchor ?? { block: 'end', inline: 'end' },
      ...(placement.offset ? { offset: placement.offset } : {}),
      avoid: placement.avoid
        ? [...placement.avoid]
        : ['safe-area', 'chrome'],
    },
    sortScope: false,
    ...(layout?.order === undefined ? {} : { order: layout.order }),
    visible: layout?.visible ?? true,
  }
}

export function resolveNodePresentation(
  session: DesignerSession,
  node: Pick<PresentationNode, 'type'>,
): ResolvedPresentationLayout {
  return resolvePresentationLayout(session.materials.get(node.type)?.presentation.layout)
}

export function resolveContainerRegions(
  session: DesignerSession,
  node: DeepReadonly<NodeDefinition> | PresentationNode,
): readonly PresentationRegionDefinition[] {
  const declaration = session.materials.get(node.type)?.schema?.container
  if (!declaration || session.document.isNodeReadOnly(node.id))
    return []
  return declaration.regions.map(region => ({
    id: region.id,
    title: region.id,
    ...(region.accepts || region.cardinality
      ? {
          constraints: {
            ...(region.accepts?.types ? { includeTypes: [...region.accepts.types] } : {}),
            ...(region.cardinality?.min === undefined ? {} : { minItems: region.cardinality.min }),
            ...(region.cardinality?.max === undefined ? {} : { maxItems: region.cardinality.max }),
          },
        }
      : {}),
  }))
}
