import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'

export interface NodeGeometryRegistry {
  register: (nodeId: string, element: HTMLElement | null) => () => void
  get: (nodeId: string) => HTMLElement | null
  measure: (nodeId: string) => DOMRect | null
}

export function createNodeGeometryRegistry(): NodeGeometryRegistry {
  const elements = new Map<string, HTMLElement>()

  return {
    register(nodeId, element) {
      if (element)
        elements.set(nodeId, element)
      else
        elements.delete(nodeId)

      return () => {
        if (elements.get(nodeId) === element)
          elements.delete(nodeId)
      }
    },
    get: nodeId => elements.get(nodeId) ?? null,
    measure: (nodeId) => {
      const element = elements.get(nodeId)
      return element?.getBoundingClientRect() ?? null
    },
  }
}

export const NODE_GEOMETRY_REGISTRY_KEY: InjectionKey<NodeGeometryRegistry>
  = Symbol('dc-node-geometry-registry')

const DETACHED_REGISTRY: NodeGeometryRegistry = {
  register: () => () => {},
  get: () => null,
  measure: () => null,
}

export function provideNodeGeometryRegistry(registry: NodeGeometryRegistry): void {
  provide(NODE_GEOMETRY_REGISTRY_KEY, registry)
}

export function useNodeGeometryRegistry(): NodeGeometryRegistry {
  return inject(NODE_GEOMETRY_REGISTRY_KEY, DETACHED_REGISTRY)
}
