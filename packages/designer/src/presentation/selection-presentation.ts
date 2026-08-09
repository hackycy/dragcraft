import type { ComputedRef, InjectionKey, Ref } from 'vue'
import { computed, inject, ref } from 'vue'

export type NodeSelectionPlane = 'root' | 'content' | 'viewport'
export type NodeSelectionProjectionKind = 'root-segment' | 'material-bounds'

export interface NodeSelectionRect {
  top: number
  left: number
  width: number
  height: number
}

export interface NodeSelectionProjection {
  kind: NodeSelectionProjectionKind
  plane: NodeSelectionPlane
  /** Material border box relative to the registered plane. */
  materialBounds: NodeSelectionRect
  /** Renderer-owned semantic selection range relative to the registered plane. */
  bounds: NodeSelectionRect
}

export interface NodeSelectionPresentationHost {
  registerPlane: (plane: NodeSelectionPlane, element: HTMLElement | null) => void
}

export interface NodeSelectionPresentation extends NodeSelectionPresentationHost {
  registerFallback: (element: HTMLElement | null) => void
  getPlane: (plane: NodeSelectionPlane) => ComputedRef<HTMLElement | null>
}

export const NODE_SELECTION_PRESENTATION_KEY: InjectionKey<NodeSelectionPresentation>
  = Symbol('dc-node-selection-presentation')

export const NODE_SELECTION_PLANE_KEY: InjectionKey<Readonly<Ref<NodeSelectionPlane>>>
  = Symbol('dc-node-selection-plane')

const DETACHED_PLANE = computed<HTMLElement | null>(() => null)
const DETACHED_PRESENTATION: NodeSelectionPresentation = {
  registerPlane: () => {},
  registerFallback: () => {},
  getPlane: () => DETACHED_PLANE,
}

export function createNodeSelectionPresentation(): NodeSelectionPresentation {
  const planes: Record<NodeSelectionPlane, Ref<HTMLElement | null>> = {
    root: ref(null),
    content: ref(null),
    viewport: ref(null),
  }
  const fallback = ref<HTMLElement | null>(null)
  const resolvedPlanes: Record<NodeSelectionPlane, ComputedRef<HTMLElement | null>> = {
    root: computed(() => planes.root.value ?? fallback.value),
    content: computed(() => planes.content.value ?? fallback.value),
    viewport: computed(() => planes.viewport.value ?? fallback.value),
  }

  return {
    registerPlane(plane, element) {
      planes[plane].value = element
    },
    registerFallback(element) {
      fallback.value = element
    },
    getPlane(plane) {
      return resolvedPlanes[plane]
    },
  }
}

export function useNodeSelectionPresentation(): NodeSelectionPresentation {
  return inject(NODE_SELECTION_PRESENTATION_KEY, DETACHED_PRESENTATION)
}
