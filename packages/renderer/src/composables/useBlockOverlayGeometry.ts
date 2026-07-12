import type { Ref } from 'vue'
import { onBeforeUnmount, ref, watch } from 'vue'

const CLIP_OVERFLOW_RE = /auto|scroll|hidden|clip|overlay/

export interface BlockOverlayGeometry {
  top: number
  left: number
  width: number
  height: number
  visible: boolean
}

export interface UseBlockOverlayGeometryOptions {
  boundarySelector?: string
  paintInset?: number
  selfTargetSelector?: string
}

export interface UseBlockOverlayGeometryReturn {
  geometry: Ref<BlockOverlayGeometry>
  update: () => void
}

function getEffectiveClipRect(el: HTMLElement): Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'> {
  let top = 0
  let bottom = window.innerHeight
  let left = 0
  let right = window.innerWidth

  let current = el.parentElement
  while (current) {
    const style = getComputedStyle(current)
    const clipsY = CLIP_OVERFLOW_RE.test(style.overflowY)
    const clipsX = CLIP_OVERFLOW_RE.test(style.overflowX)

    if (clipsX || clipsY) {
      const rect = current.getBoundingClientRect()
      if (clipsY) {
        top = Math.max(top, rect.top)
        bottom = Math.min(bottom, rect.bottom)
      }
      if (clipsX) {
        left = Math.max(left, rect.left)
        right = Math.min(right, rect.right)
      }
    }

    current = current.parentElement
  }

  return { top, right, bottom, left }
}

function resolveTargetElement(hostEl: HTMLElement, selfTargetSelector: string | undefined): HTMLElement {
  if (hostEl.dataset.dcLayerMode !== 'self' || !selfTargetSelector)
    return hostEl

  const candidate = hostEl.querySelector<HTMLElement>(selfTargetSelector)
  if (!candidate)
    return hostEl

  const rect = candidate.getBoundingClientRect()
  return rect.width > 0 || rect.height > 0 ? candidate : hostEl
}

function resolveBoundaryElement(hostEl: HTMLElement, targetEl: HTMLElement, boundarySelector: string | undefined): HTMLElement | null {
  if (!boundarySelector)
    return null

  return hostEl.closest<HTMLElement>(boundarySelector)
    ?? targetEl.closest<HTMLElement>(boundarySelector)
}

function resolvePaintInset(size: number, requestedInset: number): number {
  return Math.min(requestedInset, Math.max(0, (size - 1) / 2))
}

export function useBlockOverlayGeometry(
  elRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
  options: UseBlockOverlayGeometryOptions = {},
): UseBlockOverlayGeometryReturn {
  const geometry = ref<BlockOverlayGeometry>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    visible: false,
  })

  let rafId: number | null = null

  function applyGeometry(next: BlockOverlayGeometry): void {
    const prev = geometry.value
    if (
      prev.top !== next.top
      || prev.left !== next.left
      || prev.width !== next.width
      || prev.height !== next.height
      || prev.visible !== next.visible
    ) {
      geometry.value = next
    }
  }

  function update(): void {
    const hostEl = elRef.value
    if (!hostEl) {
      applyGeometry({ ...geometry.value, visible: false })
      return
    }

    const targetEl = resolveTargetElement(hostEl, options.selfTargetSelector)
    const boundaryEl = resolveBoundaryElement(hostEl, targetEl, options.boundarySelector)
    const targetRect = targetEl.getBoundingClientRect()
    const boundaryRect = boundaryEl?.getBoundingClientRect()
    const clip = getEffectiveClipRect(targetEl)

    const clipTop = Math.max(clip.top, boundaryRect?.top ?? -Infinity)
    const clipRight = Math.min(clip.right, boundaryRect?.right ?? Infinity)
    const clipBottom = Math.min(clip.bottom, boundaryRect?.bottom ?? Infinity)
    const clipLeft = Math.max(clip.left, boundaryRect?.left ?? -Infinity)
    const visibleTop = Math.max(targetRect.top, clipTop)
    const visibleRight = Math.min(targetRect.right, clipRight)
    const visibleBottom = Math.min(targetRect.bottom, clipBottom)
    const visibleLeft = Math.max(targetRect.left, clipLeft)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
    const visibleWidth = Math.max(0, visibleRight - visibleLeft)
    const overlayLeft = boundaryRect ? Math.max(boundaryRect.left, clipLeft) : visibleLeft
    const overlayRight = boundaryRect ? Math.min(boundaryRect.right, clipRight) : visibleRight
    const overlayWidth = Math.max(0, overlayRight - overlayLeft)
    const visible = visibleHeight > 0 && visibleWidth > 0 && overlayWidth > 0
    const requestedPaintInset = Math.max(0, options.paintInset ?? 0)
    const inlinePaintInset = resolvePaintInset(overlayWidth, requestedPaintInset)
    const blockPaintInset = resolvePaintInset(visibleHeight, requestedPaintInset)

    applyGeometry({
      top: visibleTop + blockPaintInset,
      left: overlayLeft + inlinePaintInset,
      width: overlayWidth - inlinePaintInset * 2,
      height: visibleHeight - blockPaintInset * 2,
      visible,
    })
  }

  function startPolling(): void {
    function loop(): void {
      update()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  }

  function stopPolling(): void {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  watch([elRef, isActive] as const, ([newEl, active]) => {
    stopPolling()
    if (newEl && active)
      startPolling()
    else
      applyGeometry({ ...geometry.value, visible: false })
  }, { immediate: true })

  onBeforeUnmount(stopPolling)

  return { geometry, update }
}
