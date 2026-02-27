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
  const { gap = 8, toolbarWidth = 32 } = options

  const position = ref<ToolbarPositionData>({
    top: 0,
    left: 0,
    visible: false,
  })

  let rafId: number | null = null

  // ── Core update logic ──

  function update() {
    const el = elRef.value
    if (!el) {
      applyPosition(0, 0, false)
      return
    }

    const rect = el.getBoundingClientRect()
    const clip = getEffectiveClipRect(el)

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
    let left = rect.right + gap

    // If toolbar would go off the right edge of clip area, flip to left side
    if (left + toolbarWidth > clip.right) {
      left = rect.left - gap - toolbarWidth
    }

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
