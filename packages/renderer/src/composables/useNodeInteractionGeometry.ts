import type { Ref } from 'vue'
import type { NodeInteractionGeometryMode } from '../node-interaction'
import { onBeforeUnmount, ref, watch } from 'vue'

const CLIP_OVERFLOW_RE = /auto|scroll|hidden|clip|overlay/

export interface NodeInteractionRect {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

export interface NodeInteractionGeometry {
  visibleRect: NodeInteractionRect
  paintRect: NodeInteractionRect
  visible: boolean
}

export interface UseNodeInteractionGeometryOptions {
  mode: NodeInteractionGeometryMode
  boundarySelector?: string
  paintInset?: number
  selfTargetSelector?: string
}

export interface UseNodeInteractionGeometryReturn {
  geometry: Ref<NodeInteractionGeometry>
  update: () => void
}

const EMPTY_RECT: NodeInteractionRect = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
}

function makeRect(top: number, right: number, bottom: number, left: number): NodeInteractionRect {
  return {
    top,
    right,
    bottom,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
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
  return rect.width > 0 && rect.height > 0 ? candidate : hostEl
}

function resolveBoundaryElement(
  hostEl: HTMLElement,
  targetEl: HTMLElement,
  boundarySelector: string | undefined,
): HTMLElement | null {
  if (!boundarySelector)
    return null

  return hostEl.closest<HTMLElement>(boundarySelector)
    ?? targetEl.closest<HTMLElement>(boundarySelector)
}

function resolvePaintInset(size: number, requestedInset: number): number {
  return Math.min(requestedInset, Math.max(0, (size - 1) / 2))
}

function insetRect(rect: NodeInteractionRect, requestedInset: number): NodeInteractionRect {
  const inlineInset = resolvePaintInset(rect.width, requestedInset)
  const blockInset = resolvePaintInset(rect.height, requestedInset)
  return makeRect(
    rect.top + blockInset,
    rect.right - inlineInset,
    rect.bottom - blockInset,
    rect.left + inlineInset,
  )
}

function isSameRect(left: NodeInteractionRect, right: NodeInteractionRect): boolean {
  return left.top === right.top
    && left.right === right.right
    && left.bottom === right.bottom
    && left.left === right.left
}

export function useNodeInteractionGeometry(
  elRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
  options: UseNodeInteractionGeometryOptions,
): UseNodeInteractionGeometryReturn {
  const geometry = ref<NodeInteractionGeometry>({
    visibleRect: EMPTY_RECT,
    paintRect: EMPTY_RECT,
    visible: false,
  })
  let rafId: number | null = null

  function applyGeometry(next: NodeInteractionGeometry): void {
    const previous = geometry.value
    if (
      previous.visible !== next.visible
      || !isSameRect(previous.visibleRect, next.visibleRect)
      || !isSameRect(previous.paintRect, next.paintRect)
    ) {
      geometry.value = next
    }
  }

  function hide(): void {
    if (geometry.value.visible)
      applyGeometry({ ...geometry.value, visible: false })
  }

  function update(): void {
    const hostEl = elRef.value
    if (!hostEl || !isActive.value) {
      hide()
      return
    }

    const targetEl = resolveTargetElement(hostEl, options.selfTargetSelector)
    const targetRect = targetEl.getBoundingClientRect()
    if (targetRect.width <= 0 || targetRect.height <= 0) {
      hide()
      return
    }

    const boundaryEl = resolveBoundaryElement(hostEl, targetEl, options.boundarySelector)
    const boundaryRect = boundaryEl?.getBoundingClientRect()
    const clip = getEffectiveClipRect(targetEl)
    const clipTop = Math.max(clip.top, boundaryRect?.top ?? -Infinity)
    const clipRight = Math.min(clip.right, boundaryRect?.right ?? Infinity)
    const clipBottom = Math.min(clip.bottom, boundaryRect?.bottom ?? Infinity)
    const clipLeft = Math.max(clip.left, boundaryRect?.left ?? -Infinity)
    const visibleTop = Math.max(targetRect.top, clipTop)
    const visibleBottom = Math.min(targetRect.bottom, clipBottom)
    const targetVisibleLeft = Math.max(targetRect.left, clipLeft)
    const targetVisibleRight = Math.min(targetRect.right, clipRight)

    const visibleLeft = options.mode === 'root-band' && boundaryRect
      ? Math.max(boundaryRect.left, clipLeft)
      : targetVisibleLeft
    const visibleRight = options.mode === 'root-band' && boundaryRect
      ? Math.min(boundaryRect.right, clipRight)
      : targetVisibleRight
    const visibleRect = makeRect(visibleTop, visibleRight, visibleBottom, visibleLeft)
    const targetIsVisible = visibleBottom > visibleTop && targetVisibleRight > targetVisibleLeft
    const visible = targetIsVisible && visibleRect.width > 0 && visibleRect.height > 0

    if (!visible) {
      hide()
      return
    }

    applyGeometry({
      visibleRect,
      paintRect: insetRect(visibleRect, Math.max(0, options.paintInset ?? 0)),
      visible: true,
    })
  }

  function stopPolling(): void {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function startPolling(): void {
    function loop(): void {
      update()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  }

  watch([elRef, isActive] as const, ([newEl, active]) => {
    stopPolling()
    if (newEl && active)
      startPolling()
    else
      hide()
  }, { immediate: true })

  onBeforeUnmount(stopPolling)

  return { geometry, update }
}
