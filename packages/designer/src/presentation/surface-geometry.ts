import type { ComputedRef, InjectionKey, Ref, VNode } from 'vue'
import { cloneVNode, computed, defineComponent, h, inject, onBeforeUnmount, provide, ref, shallowRef, Teleport, watch } from 'vue'

export type SurfaceReservationEdge = 'block-start' | 'block-end' | 'inline-start' | 'inline-end'

export interface SurfaceReservationOptions {
  readonly edge: SurfaceReservationEdge
  readonly fallbackSize?: string | number
}

interface SurfaceReservationEntry {
  readonly edge: SurfaceReservationEdge
  readonly size: Ref<number>
}

export interface SurfaceReservationManager {
  readonly insets: ComputedRef<Readonly<Record<SurfaceReservationEdge, number>>>
  register: (target: Ref<HTMLElement | null>, options: SurfaceReservationOptions) => () => void
}

export const SURFACE_RESERVATION_MANAGER_KEY: InjectionKey<SurfaceReservationManager> = Symbol('dc-surface-reservation-manager')
export const SURFACE_VIEWPORT_TARGET_KEY: InjectionKey<Ref<HTMLElement | null>> = Symbol('dc-surface-viewport-target')
export const NODE_MOUNT_PLANE_KEY: InjectionKey<'document' | 'viewport'> = Symbol('dc-node-mount-plane')

function fallbackSize(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value))
    return Math.max(0, value)
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed))
      return Math.max(0, parsed)
  }
  return 0
}

export function createSurfaceReservationManager(): SurfaceReservationManager {
  // Keep each entry's size Ref intact; deep ref unwrapping would erase its `.value` type.
  const entries = shallowRef<Set<SurfaceReservationEntry>>(new Set())
  const insets = computed(() => {
    const result: Record<SurfaceReservationEdge, number> = {
      'block-start': 0,
      'block-end': 0,
      'inline-start': 0,
      'inline-end': 0,
    }
    for (const entry of entries.value)
      result[entry.edge] += entry.size.value
    return result
  })

  return {
    insets,
    register(target, options) {
      const entry: SurfaceReservationEntry = {
        edge: options.edge,
        size: ref(fallbackSize(options.fallbackSize)),
      }
      entries.value = new Set(entries.value).add(entry)
      let observer: ResizeObserver | undefined
      const measure = (element: HTMLElement | null) => {
        if (!element)
          return
        const bounds = element.getBoundingClientRect()
        // Reservation values are consumed inside the same transformed stage;
        // use layout dimensions so a scaled visual rect is not scaled twice.
        const layoutSize = options.edge.startsWith('block') ? element.offsetHeight : element.offsetWidth
        const measured = layoutSize > 0
          ? layoutSize
          : options.edge.startsWith('block') ? bounds.height : bounds.width
        entry.size.value = measured > 0 ? measured : fallbackSize(options.fallbackSize)
      }
      const stop = watch(target, (element) => {
        observer?.disconnect()
        observer = undefined
        measure(element)
        if (element && typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(() => measure(element))
          observer.observe(element)
        }
      }, { immediate: true })
      return () => {
        stop()
        observer?.disconnect()
        const nextEntries = new Set(entries.value)
        nextEntries.delete(entry)
        entries.value = nextEntries
      }
    },
  }
}

export function useSurfaceReservation(
  target: Ref<HTMLElement | null>,
  options: SurfaceReservationOptions,
): Readonly<{ size: ComputedRef<number> }> {
  const manager = inject(SURFACE_RESERVATION_MANAGER_KEY)
  if (!manager)
    throw new Error('[dragcraft/designer] useSurfaceReservation must be called inside an ApplicationSurface')
  const unregister = manager.register(target, options)
  const size = computed(() => manager.insets.value[options.edge])
  onBeforeUnmount(unregister)
  return { size }
}

function markViewportNodeHost(vnode: VNode): VNode {
  const props = vnode.props
  if (props && 'node' in props && 'owner' in props)
    return cloneVNode(vnode, { selectionPlane: 'viewport' })
  const children = vnode.children
  if (Array.isArray(children)) {
    const nextChildren = children.map(child => typeof child === 'object' && child !== null && 'type' in child
      ? markViewportNodeHost(child as VNode)
      : child)
    return cloneVNode(vnode, { children: nextChildren })
  }
  return vnode
}

/** Moves a complete root NodeHost slot into the private ApplicationSurface viewport plane. */
export const DesignerViewportPortal = defineComponent({
  name: 'DesignerViewportPortal',
  setup(_, { slots }) {
    const target = inject(SURFACE_VIEWPORT_TARGET_KEY)
    provide(NODE_MOUNT_PLANE_KEY, 'viewport')
    return () => {
      const content = (slots.default?.() ?? []).map(markViewportNodeHost)
      return target?.value
        ? h(Teleport as any, { to: target.value }, content)
        : content
    }
  },
})
