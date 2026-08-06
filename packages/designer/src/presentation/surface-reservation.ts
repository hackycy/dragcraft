import type { InjectionKey, Ref } from 'vue'
import type { GeometryRegistry } from './geometry-registry'
import type { PresentationOwner } from './node-host'
import { inject, onScopeDispose, readonly, ref, watch } from 'vue'

export type SurfaceReservationEdge
  = | 'block-start'
    | 'block-end'
    | 'inline-start'
    | 'inline-end'

export interface SurfaceReservationOptions {
  readonly edge: SurfaceReservationEdge
  readonly fallbackSize: number
}

export interface SurfaceReservation {
  readonly offset: Readonly<Ref<number>>
  readonly size: Readonly<Ref<number>>
}

interface ReservationEntry {
  readonly token: symbol
  readonly nodeId: string
  readonly edge: SurfaceReservationEdge
  readonly registrationOrder: number
  readonly offset: Ref<number>
  readonly size: Ref<number>
  readonly stopObserving: () => void
}

export interface SurfaceReservationRegistry {
  readonly totals: Readonly<Record<SurfaceReservationEdge, Readonly<Ref<number>>>>
  readonly dispose: () => void
  readonly register: (
    nodeId: string,
    element: HTMLElement,
    options: SurfaceReservationOptions,
    offset: Ref<number>,
    size: Ref<number>,
  ) => () => void
  readonly setRootOrder: (nodeIds: readonly string[]) => void
}

export interface SurfaceReservationOwner {
  readonly nodeId: string
  readonly owner: PresentationOwner
}

export const SURFACE_RESERVATION_OWNER_KEY: InjectionKey<SurfaceReservationOwner>
  = Symbol('dc-surface-reservation-owner')

export const SURFACE_RESERVATION_REGISTRY_KEY: InjectionKey<SurfaceReservationRegistry>
  = Symbol('dc-surface-reservation-registry')

const EDGES: readonly SurfaceReservationEdge[] = [
  'block-start',
  'block-end',
  'inline-start',
  'inline-end',
]

export function createSurfaceReservationRegistry(
  geometry: GeometryRegistry,
): SurfaceReservationRegistry {
  const entries = new Map<symbol, ReservationEntry>()
  const rootOrder = new Map<string, number>()
  const mutableTotals: Record<SurfaceReservationEdge, Ref<number>> = {
    'block-start': ref(0),
    'block-end': ref(0),
    'inline-start': ref(0),
    'inline-end': ref(0),
  }
  let registrationOrder = 0

  function recompute(): void {
    for (const edge of EDGES) {
      const ordered = Array.from(entries.values())
        .filter(entry => entry.edge === edge)
        .sort((left, right) => {
          const rootDifference = (rootOrder.get(left.nodeId) ?? Number.MAX_SAFE_INTEGER)
            - (rootOrder.get(right.nodeId) ?? Number.MAX_SAFE_INTEGER)
          return rootDifference || left.registrationOrder - right.registrationOrder
        })
      let offset = 0
      for (const entry of ordered) {
        entry.offset.value = offset
        offset += entry.size.value
      }
      mutableTotals[edge].value = offset
    }
  }

  function register(
    nodeId: string,
    element: HTMLElement,
    options: SurfaceReservationOptions,
    offset: Ref<number>,
    size: Ref<number>,
  ): () => void {
    const token = Symbol(nodeId)
    const fallbackSize = Number.isFinite(options.fallbackSize)
      ? Math.max(0, options.fallbackSize)
      : 0
    const measure = (): void => {
      const rect = element.getBoundingClientRect()
      const origin = geometry.toSurfacePoint(0, 0)
      const extent = geometry.toSurfacePoint(rect.width, rect.height)
      const measured = options.edge.startsWith('block')
        ? Math.abs(extent.y - origin.y)
        : Math.abs(extent.x - origin.x)
      size.value = measured > 0 ? measured : fallbackSize
      recompute()
    }
    const stopObserving = geometry.observeSize(element, measure)
    entries.set(token, {
      token,
      nodeId,
      edge: options.edge,
      registrationOrder: registrationOrder++,
      offset,
      size,
      stopObserving,
    })
    measure()
    return () => {
      const entry = entries.get(token)
      if (!entry)
        return
      entries.delete(token)
      entry.stopObserving()
      offset.value = 0
      size.value = fallbackSize
      recompute()
    }
  }

  function setRootOrder(nodeIds: readonly string[]): void {
    rootOrder.clear()
    nodeIds.forEach((nodeId, index) => rootOrder.set(nodeId, index))
    recompute()
  }

  function dispose(): void {
    for (const entry of entries.values())
      entry.stopObserving()
    entries.clear()
    EDGES.forEach(edge => mutableTotals[edge].value = 0)
  }

  return Object.freeze({
    totals: Object.freeze({
      'block-start': readonly(mutableTotals['block-start']),
      'block-end': readonly(mutableTotals['block-end']),
      'inline-start': readonly(mutableTotals['inline-start']),
      'inline-end': readonly(mutableTotals['inline-end']),
    }),
    dispose,
    register,
    setRootOrder,
  })
}

export function useSurfaceReservation(
  element: Readonly<Ref<HTMLElement | null>>,
  options: SurfaceReservationOptions,
): SurfaceReservation {
  const registry = inject(SURFACE_RESERVATION_REGISTRY_KEY)
  const owner = inject(SURFACE_RESERVATION_OWNER_KEY)
  if (!registry || !owner)
    throw new Error('useSurfaceReservation must be called inside a PresentationFrame')
  const offset = ref(0)
  const size = ref(Math.max(0, options.fallbackSize))
  let unregister: (() => void) | undefined
  const stopWatching = watch(element, (next) => {
    unregister?.()
    unregister = undefined
    if (next && owner.owner.kind === 'page-root')
      unregister = registry.register(owner.nodeId, next, options, offset, size)
  }, { immediate: true })
  onScopeDispose(() => {
    stopWatching()
    unregister?.()
  })
  return Object.freeze({
    offset: readonly(offset),
    size: readonly(size),
  })
}
