import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'

export type CanvasInteractionMode = 'pointer' | 'hand'

export interface CanvasPanOffset {
  x: number
  y: number
}

export interface UseCanvasPanReturn {
  mode: Ref<CanvasInteractionMode>
  offset: Ref<CanvasPanOffset>
  pixelSnap: Ref<CanvasPanOffset>
  panEnabled: ComputedRef<boolean>
  isPanning: Ref<boolean>
  setMode: (mode: CanvasInteractionMode) => void
  reset: () => void
  handlePointerEnter: () => void
  handlePointerLeave: () => void
  handlePointerDown: (event: PointerEvent) => void
  handlePointerMove: (event: PointerEvent) => void
  handlePointerUp: (event: PointerEvent) => void
  handleClickCapture: (event: MouseEvent) => void
}

export interface CanvasStagePixelGeometry {
  viewport: {
    left: number
    top: number
    width: number
    height: number
  }
  stage: {
    width: number
    height: number
  }
  offset: CanvasPanOffset
}

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]'

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR))
}

function resolvePixelCorrection(value: number, devicePixelRatio: number): number {
  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const snapped = Math.floor(value * ratio + 0.5 - 1e-7) / ratio
  const correction = snapped - value
  return Math.abs(correction) < 1e-7 ? 0 : correction
}

export function resolveCanvasStagePixelSnap(
  geometry: CanvasStagePixelGeometry,
  devicePixelRatio: number,
): CanvasPanOffset {
  const left = geometry.viewport.left
    + (geometry.viewport.width - geometry.stage.width) / 2
    + geometry.offset.x
  const top = geometry.viewport.top
    + (geometry.viewport.height - geometry.stage.height) / 2
    + geometry.offset.y

  return {
    x: resolvePixelCorrection(left, devicePixelRatio),
    y: resolvePixelCorrection(top, devicePixelRatio),
  }
}

export function useCanvasPan(
  viewportRef: Ref<HTMLElement | null>,
  stageRef: Ref<HTMLElement | null>,
): UseCanvasPanReturn {
  const mode = ref<CanvasInteractionMode>('pointer')
  const offset = ref<CanvasPanOffset>({ x: 0, y: 0 })
  const pixelSnap = ref<CanvasPanOffset>({ x: 0, y: 0 })
  const spacePressed = ref(false)
  const isPanning = ref(false)
  const pointerInside = ref(false)
  const panEnabled = computed(() => mode.value === 'hand' || spacePressed.value)

  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let startOffsetX = 0
  let startOffsetY = 0
  let suppressClick = false
  let resizeObserver: ResizeObserver | null = null

  function updatePixelSnap(): void {
    const viewport = viewportRef.value
    const stage = stageRef.value
    if (!viewport || !stage)
      return

    const viewportRect = viewport.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    const next = resolveCanvasStagePixelSnap({
      viewport: {
        left: viewportRect.left,
        top: viewportRect.top,
        width: viewportRect.width,
        height: viewportRect.height,
      },
      stage: {
        width: stageRect.width,
        height: stageRect.height,
      },
      offset: offset.value,
    }, window.devicePixelRatio)

    if (next.x !== pixelSnap.value.x || next.y !== pixelSnap.value.y)
      pixelSnap.value = next
  }

  function setMode(nextMode: CanvasInteractionMode): void {
    mode.value = nextMode
  }

  function reset(): void {
    offset.value = { x: 0, y: 0 }
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    const viewport = viewportRef.value
    const focusedInside = viewport != null && document.activeElement != null && viewport.contains(document.activeElement)
    if (event.code !== 'Space' || isEditableTarget(event.target) || (!pointerInside.value && !focusedInside))
      return
    event.preventDefault()
    spacePressed.value = true
  }

  function handleWindowKeyup(event: KeyboardEvent): void {
    if (event.code !== 'Space')
      return
    spacePressed.value = false
  }

  function resetTemporaryMode(): void {
    spacePressed.value = false
    isPanning.value = false
    pointerId = null
  }

  function handlePointerEnter(): void {
    pointerInside.value = true
  }

  function handlePointerLeave(): void {
    pointerInside.value = false
  }

  function handlePointerDown(event: PointerEvent): void {
    const viewport = viewportRef.value
    if (!viewport || !panEnabled.value || event.button !== 0)
      return

    event.preventDefault()
    event.stopPropagation()
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    startOffsetX = offset.value.x
    startOffsetY = offset.value.y
    suppressClick = true
    isPanning.value = true
    viewport.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent): void {
    const viewport = viewportRef.value
    if (!viewport || pointerId !== event.pointerId)
      return

    event.preventDefault()
    event.stopPropagation()
    offset.value = {
      x: startOffsetX + event.clientX - startX,
      y: startOffsetY + event.clientY - startY,
    }
  }

  function handlePointerUp(event: PointerEvent): void {
    const viewport = viewportRef.value
    if (!viewport || pointerId !== event.pointerId)
      return

    event.preventDefault()
    event.stopPropagation()
    viewport.releasePointerCapture?.(event.pointerId)
    pointerId = null
    isPanning.value = false
  }

  function handleClickCapture(event: MouseEvent): void {
    if (!panEnabled.value && !suppressClick)
      return
    event.preventDefault()
    event.stopPropagation()
    suppressClick = false
  }

  onMounted(() => {
    window.addEventListener('keydown', handleWindowKeydown)
    window.addEventListener('keyup', handleWindowKeyup)
    window.addEventListener('blur', resetTemporaryMode)
    window.addEventListener('resize', updatePixelSnap)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updatePixelSnap)
      if (viewportRef.value)
        resizeObserver.observe(viewportRef.value)
      if (stageRef.value)
        resizeObserver.observe(stageRef.value)
    }
    updatePixelSnap()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleWindowKeydown)
    window.removeEventListener('keyup', handleWindowKeyup)
    window.removeEventListener('blur', resetTemporaryMode)
    window.removeEventListener('resize', updatePixelSnap)
    resizeObserver?.disconnect()
  })

  onUpdated(updatePixelSnap)
  watch(offset, updatePixelSnap, { flush: 'sync' })

  return {
    mode,
    offset,
    pixelSnap,
    panEnabled,
    isPanning,
    setMode,
    reset,
    handlePointerEnter,
    handlePointerLeave,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClickCapture,
  }
}
