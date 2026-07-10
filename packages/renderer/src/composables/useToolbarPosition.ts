import type { Ref } from 'vue'
import type { ToolbarPositionData } from '../types'
import { autoUpdate } from '@floating-ui/dom'
import { onBeforeUnmount, ref, watch } from 'vue'

export interface UseToolbarPositionOptions {
  gap?: number
  interactionBoundary?: Ref<HTMLElement | null>
  targetSelector?: string
  selfTargetSelector?: string
  boundarySelector?: string
  padding?: number
}

export interface UseToolbarPositionReturn {
  position: Ref<ToolbarPositionData>
  update: () => Promise<void>
}

export function useToolbarPosition(
  referenceRef: Ref<HTMLElement | null>,
  floatingRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
  options: UseToolbarPositionOptions = {},
): UseToolbarPositionReturn {
  const {
    gap = 8,
    interactionBoundary,
    targetSelector,
    selfTargetSelector,
    boundarySelector,
    padding = 8,
  } = options
  const position = ref<ToolbarPositionData>({
    x: 0,
    y: 0,
    placement: 'left-start',
    strategy: 'fixed',
    visible: false,
  })
  let cleanupAutoUpdate: (() => void) | null = null

  function resolveReference(host: HTMLElement): HTMLElement {
    const selector = targetSelector
      ?? (host.dataset.dcLayerMode === 'self' ? selfTargetSelector : undefined)
    if (!selector)
      return host
    const candidate = host.querySelector<HTMLElement>(selector)
    if (!candidate)
      return host
    const rect = candidate.getBoundingClientRect()
    return rect.width > 0 || rect.height > 0 ? candidate : host
  }

  function isReferenceVisible(reference: HTMLElement, boundary: HTMLElement | null): boolean {
    const rect = reference.getBoundingClientRect()
    const clip = boundary?.getBoundingClientRect() ?? {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
    }
    return rect.bottom > clip.top
      && rect.top < clip.bottom
      && rect.right > clip.left
      && rect.left < clip.right
  }

  function resolveToolbarBoundary(host: HTMLElement, reference: HTMLElement): HTMLElement | null {
    if (!boundarySelector)
      return null
    return host.closest<HTMLElement>(boundarySelector)
      ?? reference.closest<HTMLElement>(boundarySelector)
  }

  function applyPosition(next: ToolbarPositionData): void {
    const current = position.value
    if (
      current.x === next.x
      && current.y === next.y
      && current.placement === next.placement
      && current.strategy === next.strategy
      && current.visible === next.visible
    ) {
      return
    }
    position.value = next
  }

  async function update(): Promise<void> {
    const host = referenceRef.value
    const floating = floatingRef.value
    if (!host || !floating || !isActive.value) {
      applyPosition({ ...position.value, visible: false })
      return
    }

    const reference = resolveReference(host)
    const boundaryElement = interactionBoundary?.value ?? null
    if (!isReferenceVisible(reference, boundaryElement)) {
      applyPosition({ ...position.value, visible: false })
      return
    }

    const referenceRect = reference.getBoundingClientRect()
    const floatingRect = floating.getBoundingClientRect()
    const clipRect = boundaryElement?.getBoundingClientRect() ?? {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
    }
    const toolbarBoundary = resolveToolbarBoundary(host, reference)
    const ownerRect = toolbarBoundary?.getBoundingClientRect() ?? referenceRect
    const availableHeight = Math.max(0, clipRect.bottom - clipRect.top - padding * 2)
    const minY = clipRect.top + padding
    const maxY = Math.max(minY, clipRect.bottom - padding - floatingRect.height)

    floating.style.maxHeight = `${availableHeight}px`

    applyPosition({
      x: ownerRect.left - gap - floatingRect.width,
      y: Math.min(Math.max(referenceRect.top, minY), maxY),
      placement: 'left-start',
      strategy: 'fixed',
      visible: true,
    })
  }

  function stopAutoUpdate(): void {
    cleanupAutoUpdate?.()
    cleanupAutoUpdate = null
  }

  function startAutoUpdate(): void {
    stopAutoUpdate()
    const host = referenceRef.value
    const floating = floatingRef.value
    if (!host || !floating || !isActive.value)
      return
    cleanupAutoUpdate = autoUpdate(resolveReference(host), floating, update, {
      animationFrame: true,
      ancestorResize: true,
      ancestorScroll: true,
      elementResize: true,
      layoutShift: true,
    })
  }

  watch([referenceRef, floatingRef, isActive] as const, () => {
    if (isActive.value) {
      startAutoUpdate()
    }
    else {
      stopAutoUpdate()
      applyPosition({ ...position.value, visible: false })
    }
  }, { immediate: true, flush: 'post' })

  onBeforeUnmount(stopAutoUpdate)

  return { position, update }
}
