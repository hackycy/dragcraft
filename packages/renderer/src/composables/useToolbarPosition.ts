import type { Ref } from 'vue'
import type { ToolbarPositionData } from '../types'
import { onBeforeUnmount, ref, watch } from 'vue'

// ── Helpers ──

const CLIP_OVERFLOW_RE = /auto|scroll|hidden|clip|overlay/

/**
 * Compute the effective visible clip rect by intersecting
 * the viewport rect with all scrollable ancestor rects.
 * Handles overflowX and overflowY independently.
 */
function getEffectiveClipRect(el: HTMLElement) {
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
      const r = current.getBoundingClientRect()
      if (clipsY) {
        top = Math.max(top, r.top)
        bottom = Math.min(bottom, r.bottom)
      }
      if (clipsX) {
        left = Math.max(left, r.left)
        right = Math.min(right, r.right)
      }
    }

    current = current.parentElement
  }

  return { top, bottom, left, right }
}

/** Options for useToolbarPosition. */
export interface UseToolbarPositionOptions {
  /** Horizontal gap (px) between widget right edge and toolbar left edge. Default: 8 */
  gap?: number
  /** Approximate toolbar width (px), used for viewport edge clamping. Default: 32 */
  toolbarWidth?: number
  /** Reactive max right boundary (px, viewport-relative). When set, toolbar flips to left if it would exceed this. */
  maxRight?: Ref<number | undefined>
  /** Optional descendant selector used as the visual/interaction geometry anchor. */
  targetSelector?: string
  /** Optional descendant selector used only when the layout host is a self-positioned layer plane. */
  selfTargetSelector?: string
  /** Optional ancestor selector whose outside edge owns toolbar placement. */
  boundarySelector?: string
}

export interface UseToolbarPositionReturn {
  /** Reactive toolbar position data. */
  position: Ref<ToolbarPositionData>
  /** Manually trigger a position recalculation. */
  update: () => void
}

/**
 * Composable that computes viewport-fixed coordinates for a floating toolbar,
 * tracking the widget element across scroll, resize, and layout changes.
 *
 * Uses a `requestAnimationFrame` polling loop to catch ALL position changes
 * (scroll, resize, DOM reflow during drag, CSS animations, etc.). This is the
 * same approach used by Floating UI's `autoUpdate` with `animationFrame: true`.
 *
 * The `isActive` ref controls when polling starts/stops. Pass the widget's
 * `isSelected` computed so that only the selected widget incurs rAF overhead
 * (at most 1 at a time). Non-selected widgets have zero polling cost.
 */
export function useToolbarPosition(
  elRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
  options: UseToolbarPositionOptions = {},
): UseToolbarPositionReturn {
  const { gap = 8, toolbarWidth = 32, maxRight, targetSelector, selfTargetSelector, boundarySelector } = options

  const position = ref<ToolbarPositionData>({
    top: 0,
    left: 0,
    visible: false,
  })

  let rafId: number | null = null

  // ── Core update logic ──

  function update() {
    const hostEl = elRef.value
    if (!hostEl) {
      applyPosition(0, 0, false)
      return
    }

    const anchorEl = resolveAnchorElement(hostEl)
    const rect = anchorEl.getBoundingClientRect()
    const clip = getEffectiveClipRect(anchorEl)
    const boundaryRect = resolveBoundaryElement(hostEl, anchorEl)?.getBoundingClientRect()

    // Check if widget is at least partially visible in effective clip area
    // (viewport ∩ all scrollable ancestor containers)
    const isVisible
      = rect.bottom > clip.top
        && rect.top < clip.bottom
        && rect.right > clip.left
        && rect.left < clip.right

    if (!isVisible) {
      applyPosition(position.value.top, position.value.left, false)
      return
    }

    let top = rect.top
    const left = boundaryRect
      ? computeBoundaryOutsideLeft(boundaryRect)
      : computeAnchorLeft(rect, clip)

    // Clamp top to effective clip bounds
    top = Math.max(top, clip.top)
    top = Math.min(top, clip.bottom - 40)

    applyPosition(top, left, true)
  }

  /**
   * Only update the reactive ref when values actually change,
   * avoiding unnecessary Vue re-renders during rAF polling.
   */
  function applyPosition(top: number, left: number, visible: boolean) {
    const prev = position.value
    if (prev.top !== top || prev.left !== left || prev.visible !== visible) {
      position.value = { top, left, visible }
    }
  }

  function resolveAnchorElement(hostEl: HTMLElement): HTMLElement {
    const selector = targetSelector
      ?? (hostEl.dataset.dcLayerMode === 'self' ? selfTargetSelector : undefined)

    if (!selector)
      return hostEl

    const candidate = hostEl.querySelector<HTMLElement>(selector)
    if (!candidate)
      return hostEl

    const rect = candidate.getBoundingClientRect()
    return rect.width > 0 || rect.height > 0 ? candidate : hostEl
  }

  function resolveBoundaryElement(hostEl: HTMLElement, anchorEl: HTMLElement): HTMLElement | null {
    if (!boundarySelector)
      return null

    return hostEl.closest<HTMLElement>(boundarySelector)
      ?? anchorEl.closest<HTMLElement>(boundarySelector)
  }

  function effectiveRight(clip: { right: number }): number {
    const boundary = maxRight?.value
    return boundary != null ? Math.min(clip.right, boundary) : clip.right
  }

  function computeAnchorLeft(rect: DOMRect, clip: { right: number }): number {
    const rightSide = rect.right + gap
    if (rightSide + toolbarWidth <= effectiveRight(clip))
      return rightSide

    return rect.left - gap - toolbarWidth
  }

  function computeBoundaryOutsideLeft(rect: DOMRect): number {
    return rect.left - gap - toolbarWidth
  }

  // ── rAF polling loop ──

  function startPolling() {
    function loop() {
      update()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  }

  function stopPolling() {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  // ── Lifecycle management ──

  watch([elRef, isActive] as const, ([newEl, active]) => {
    stopPolling()
    if (newEl && active) {
      startPolling()
    }
    else {
      applyPosition(0, 0, false)
    }
  }, { immediate: true })

  onBeforeUnmount(stopPolling)

  return { position, update }
}
