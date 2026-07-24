import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export type CanvasInteractionMode = 'pointer' | 'hand'

export interface CanvasPanOffset {
  x: number
  y: number
}

export interface CanvasFitGeometry {
  viewport: {
    width: number
    height: number
  }
  frame: {
    width: number
    height: number
  }
  gutter?: number
}

export interface UseCanvasViewReturn {
  mode: Ref<CanvasInteractionMode>
  offset: Ref<CanvasPanOffset>
  scale: Ref<number>
  pixelSnap: Ref<CanvasPanOffset>
  panEnabled: ComputedRef<boolean>
  isPanning: Ref<boolean>
  canZoomIn: ComputedRef<boolean>
  canZoomOut: ComputedRef<boolean>
  setMode: (mode: CanvasInteractionMode) => void
  setFitTarget: (target: HTMLElement | null) => void
  center: () => void
  reset: () => void
  fit: () => boolean
  zoomIn: () => void
  zoomOut: () => void
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

export const CANVAS_FIT_GUTTER = 32
export const CANVAS_ZOOM_MIN = 0.1
export const CANVAS_ZOOM_MAX = 2
export const CANVAS_ZOOM_STEP = 0.1

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]'
const SCALE_EPSILON = 1e-7

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR))
}

function resolvePixelCorrection(value: number, devicePixelRatio: number): number {
  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const snapped = Math.floor(value * ratio + 0.5 - 1e-7) / ratio
  const correction = snapped - value
  return Math.abs(correction) < 1e-7 ? 0 : correction
}

function roundScale(value: number): number {
  return Math.round(value * 100 + SCALE_EPSILON) / 100
}

export function resolveCanvasFitScale(geometry: CanvasFitGeometry): number | null {
  const gutter = Math.max(0, geometry.gutter ?? CANVAS_FIT_GUTTER)
  const availableWidth = Math.max(0, geometry.viewport.width - gutter * 2)
  const availableHeight = Math.max(0, geometry.viewport.height - gutter * 2)
  if (
    geometry.frame.width <= 0
    || geometry.frame.height <= 0
    || availableWidth <= 0
    || availableHeight <= 0
  ) {
    return null
  }

  return Math.min(
    1,
    availableWidth / geometry.frame.width,
    availableHeight / geometry.frame.height,
  )
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

export function useCanvasView(
  viewportRef: Ref<HTMLElement | null>,
  stageRef: Ref<HTMLElement | null>,
): UseCanvasViewReturn {
  const mode = ref<CanvasInteractionMode>('pointer')
  const offset = ref<CanvasPanOffset>({ x: 0, y: 0 })
  const scale = ref(1)
  const pixelSnap = ref<CanvasPanOffset>({ x: 0, y: 0 })
  const spacePressed = ref(false)
  const isPanning = ref(false)
  const pointerInside = ref(false)
  const panEnabled = computed(() => mode.value === 'hand' || spacePressed.value)
  const canZoomIn = computed(() => scale.value < CANVAS_ZOOM_MAX - SCALE_EPSILON)
  const canZoomOut = computed(() => scale.value > CANVAS_ZOOM_MIN + SCALE_EPSILON)

  let fitTarget: HTMLElement | null = null
  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let startOffsetX = 0
  let startOffsetY = 0
  let suppressClick = false
  let resizeObserver: ResizeObserver | null = null
  let pixelSnapFrame: number | null = null

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

  function schedulePixelSnap(): void {
    if (pixelSnapFrame !== null)
      return
    pixelSnapFrame = window.requestAnimationFrame(() => {
      pixelSnapFrame = null
      updatePixelSnap()
    })
  }

  function observePixelGeometry(viewport: HTMLElement | null, stage: HTMLElement | null): void {
    resizeObserver?.disconnect()
    if (viewport)
      resizeObserver?.observe(viewport)
    if (stage)
      resizeObserver?.observe(stage)
    schedulePixelSnap()
  }

  function setMode(nextMode: CanvasInteractionMode): void {
    mode.value = nextMode
  }

  function setFitTarget(target: HTMLElement | null): void {
    fitTarget = target
  }

  function center(): void {
    offset.value = { x: 0, y: 0 }
  }

  function reset(): void {
    center()
    scale.value = 1
  }

  function fit(): boolean {
    center()
    const viewport = viewportRef.value
    if (!viewport || !fitTarget)
      return false

    const nextScale = resolveCanvasFitScale({
      viewport: {
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      },
      frame: {
        width: fitTarget.offsetWidth,
        height: fitTarget.offsetHeight,
      },
    })
    if (nextScale === null)
      return false

    scale.value = nextScale
    return true
  }

  function zoomIn(): void {
    if (!canZoomIn.value)
      return

    scale.value = scale.value < CANVAS_ZOOM_MIN
      ? CANVAS_ZOOM_MIN
      : Math.min(CANVAS_ZOOM_MAX, roundScale(scale.value + CANVAS_ZOOM_STEP))
  }

  function zoomOut(): void {
    if (!canZoomOut.value)
      return

    scale.value = Math.max(CANVAS_ZOOM_MIN, roundScale(scale.value - CANVAS_ZOOM_STEP))
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
    window.addEventListener('resize', schedulePixelSnap)
    if (typeof ResizeObserver !== 'undefined')
      resizeObserver = new ResizeObserver(schedulePixelSnap)
    observePixelGeometry(viewportRef.value, stageRef.value)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleWindowKeydown)
    window.removeEventListener('keyup', handleWindowKeyup)
    window.removeEventListener('blur', resetTemporaryMode)
    window.removeEventListener('resize', schedulePixelSnap)
    resizeObserver?.disconnect()
    if (pixelSnapFrame !== null)
      window.cancelAnimationFrame(pixelSnapFrame)
  })

  watch([viewportRef, stageRef], ([viewport, stage]) => {
    observePixelGeometry(viewport, stage)
  }, { flush: 'post' })
  watch([offset, scale], schedulePixelSnap, { flush: 'sync' })

  return {
    mode,
    offset,
    scale,
    pixelSnap,
    panEnabled,
    isPanning,
    canZoomIn,
    canZoomOut,
    setMode,
    setFitTarget,
    center,
    reset,
    fit,
    zoomIn,
    zoomOut,
    handlePointerEnter,
    handlePointerLeave,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClickCapture,
  }
}
