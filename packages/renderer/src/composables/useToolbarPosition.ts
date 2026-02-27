import type { Ref } from 'vue'
import type { ToolbarPositionData } from '../types'
import { onBeforeUnmount, ref, watch } from 'vue'

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
 * Only the selected widget's toolbar is tracked (at most 1 at a time), so the
 * overhead of rAF polling is negligible.
 */
export function useToolbarPosition(
  elRef: Ref<HTMLElement | null>,
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
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Check if widget is at least partially visible in viewport
    const isInViewport
      = rect.bottom > 0
        && rect.top < vh
        && rect.right > 0
        && rect.left < vw

    if (!isInViewport) {
      applyPosition(position.value.top, position.value.left, false)
      return
    }

    let top = rect.top
    let left = rect.right + gap

    // If toolbar would go off the right edge, flip to the left side
    if (left + toolbarWidth > vw) {
      left = rect.left - gap - toolbarWidth
    }

    // Clamp top to viewport bounds
    if (top < 0) {
      top = 0
    }
    if (top > vh - 40) {
      top = vh - 40
    }

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

  watch(elRef, (newEl, oldEl) => {
    if (oldEl)
      stopPolling()
    if (newEl)
      startPolling()
  }, { immediate: true })

  onBeforeUnmount(stopPolling)

  return { position, update }
}
