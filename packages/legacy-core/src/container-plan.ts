import type {
  ContainerPlanResult,
  RegistryInstance,
  SchemaNode,
} from './types'

export function createContainerPlan(
  node: SchemaNode,
  registry: RegistryInstance,
): ContainerPlanResult {
  const definition = registry.getWidget(node.type)?.container
  if (!node.container || !definition) {
    return {
      ok: false,
      code: 'CONTAINER_UNRESOLVED',
      containerId: node.id,
    }
  }

  const variant = definition.variants[node.container.variant]
  if (!variant) {
    return {
      ok: false,
      code: 'CONTAINER_VARIANT_UNKNOWN',
      containerId: node.id,
    }
  }

  return {
    ok: true,
    plan: {
      containerId: node.id,
      variant,
      regions: variant.regions.map((region) => {
        const nodes = node.container!.regions[region.id] ?? []
        return {
          definition: region,
          nodes,
          isEmpty: nodes.length === 0,
        }
      }),
    },
  }
}
