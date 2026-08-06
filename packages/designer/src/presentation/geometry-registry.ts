import type { InjectionKey, ShallowRef } from 'vue'
import { shallowRef } from 'vue'

export interface SurfaceGeometryRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly right: number
  readonly bottom: number
}

export interface SurfaceGeometryPoint {
  readonly x: number
  readonly y: number
}

export interface GeometryRegistry {
  readonly rects: Readonly<ShallowRef<ReadonlyMap<string, SurfaceGeometryRect>>>
  readonly dispose: () => void
  readonly registerNode: (nodeId: string, element: HTMLElement) => () => void
  readonly observeSize: (element: HTMLElement, listener: () => void) => () => void
  readonly scheduleMeasure: () => void
  readonly setBoundary: (element: HTMLElement | null) => void
  readonly toSurfacePoint: (clientX: number, clientY: number) => SurfaceGeometryPoint
}

export const GEOMETRY_REGISTRY_KEY: InjectionKey<GeometryRegistry>
  = Symbol('dc-geometry-registry')

export function createGeometryRegistry(): GeometryRegistry {
  const elements = new Map<string, HTMLElement>()
  const observationCounts = new Map<Element, number>()
  const sizeListeners = new Map<Element, Set<() => void>>()
  const rects = shallowRef<ReadonlyMap<string, SurfaceGeometryRect>>(new Map())
  let boundary: HTMLElement | null = null
  let frame: number | null = null
  let disposed = false
  const observer = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver((entries) => {
        for (const entry of entries)
          sizeListeners.get(entry.target)?.forEach(listener => listener())
        scheduleMeasure()
      })

  function readBoundaryGeometry(): {
    readonly rect: DOMRect
    readonly scaleX: number
    readonly scaleY: number
  } | null {
    if (!boundary)
      return null
    const rect = boundary.getBoundingClientRect()
    return {
      rect,
      scaleX: boundary.offsetWidth > 0 && rect.width > 0
        ? rect.width / boundary.offsetWidth
        : 1,
      scaleY: boundary.offsetHeight > 0 && rect.height > 0
        ? rect.height / boundary.offsetHeight
        : 1,
    }
  }

  function observe(element: Element): void {
    const count = observationCounts.get(element) ?? 0
    observationCounts.set(element, count + 1)
    if (count === 0)
      observer?.observe(element)
  }

  function unobserve(element: Element): void {
    const count = observationCounts.get(element) ?? 0
    if (count <= 1) {
      observationCounts.delete(element)
      observer?.unobserve(element)
      return
    }
    observationCounts.set(element, count - 1)
  }

  function measure(): void {
    frame = null
    if (!boundary || disposed)
      return
    const boundaryGeometry = readBoundaryGeometry()
    if (!boundaryGeometry)
      return
    const { rect: boundaryRect, scaleX, scaleY } = boundaryGeometry
    const next = new Map<string, SurfaceGeometryRect>()
    for (const [nodeId, element] of elements) {
      const rect = element.getBoundingClientRect()
      const left = (rect.left - boundaryRect.left) / scaleX
      const top = (rect.top - boundaryRect.top) / scaleY
      const width = rect.width / scaleX
      const height = rect.height / scaleY
      next.set(nodeId, Object.freeze({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
      }))
    }
    sizeListeners.forEach(listeners => listeners.forEach(listener => listener()))
    rects.value = next
  }

  function scheduleMeasure(): void {
    if (disposed || frame !== null)
      return
    frame = window.requestAnimationFrame(measure)
  }

  function setBoundary(element: HTMLElement | null): void {
    if (boundary === element)
      return
    if (boundary)
      unobserve(boundary)
    boundary = element
    if (boundary)
      observe(boundary)
    scheduleMeasure()
  }

  function registerNode(nodeId: string, element: HTMLElement): () => void {
    const previous = elements.get(nodeId)
    if (previous && previous !== element)
      unobserve(previous)
    elements.set(nodeId, element)
    observe(element)
    scheduleMeasure()
    return () => {
      if (elements.get(nodeId) !== element)
        return
      elements.delete(nodeId)
      unobserve(element)
      scheduleMeasure()
    }
  }

  function toSurfacePoint(clientX: number, clientY: number): SurfaceGeometryPoint {
    const boundaryGeometry = readBoundaryGeometry()
    if (!boundaryGeometry)
      return Object.freeze({ x: clientX, y: clientY })
    const { rect, scaleX, scaleY } = boundaryGeometry
    return Object.freeze({
      x: (clientX - rect.left) / scaleX,
      y: (clientY - rect.top) / scaleY,
    })
  }

  function observeSize(element: HTMLElement, listener: () => void): () => void {
    const listeners = sizeListeners.get(element) ?? new Set()
    listeners.add(listener)
    sizeListeners.set(element, listeners)
    observe(element)
    listener()
    return () => {
      const current = sizeListeners.get(element)
      current?.delete(listener)
      if (current?.size === 0)
        sizeListeners.delete(element)
      unobserve(element)
    }
  }

  function dispose(): void {
    if (disposed)
      return
    disposed = true
    if (frame !== null)
      window.cancelAnimationFrame(frame)
    frame = null
    observer?.disconnect()
    window.removeEventListener('resize', scheduleMeasure)
    window.removeEventListener('scroll', scheduleMeasure, true)
    elements.clear()
    observationCounts.clear()
    sizeListeners.clear()
    rects.value = new Map()
  }

  window.addEventListener('resize', scheduleMeasure)
  window.addEventListener('scroll', scheduleMeasure, true)

  return Object.freeze({
    rects,
    dispose,
    observeSize,
    registerNode,
    scheduleMeasure,
    setBoundary,
    toSurfacePoint,
  })
}
