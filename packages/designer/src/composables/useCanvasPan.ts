import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export type CanvasInteractionMode = 'pointer' | 'hand'

export interface UseCanvasPanReturn {
  mode: Ref<CanvasInteractionMode>
  panEnabled: ComputedRef<boolean>
  isPanning: Ref<boolean>
  setMode: (mode: CanvasInteractionMode) => void
  handlePointerEnter: () => void
  handlePointerLeave: () => void
  handlePointerDown: (event: PointerEvent) => void
  handlePointerMove: (event: PointerEvent) => void
  handlePointerUp: (event: PointerEvent) => void
  handleClickCapture: (event: MouseEvent) => void
}

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]'

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR))
}

export function useCanvasPan(viewportRef: Ref<HTMLElement | null>): UseCanvasPanReturn {
  const mode = ref<CanvasInteractionMode>('pointer')
  const spacePressed = ref(false)
  const isPanning = ref(false)
  const pointerInside = ref(false)
  const panEnabled = computed(() => mode.value === 'hand' || spacePressed.value)

  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let startScrollLeft = 0
  let startScrollTop = 0
  let suppressClick = false

  function setMode(nextMode: CanvasInteractionMode): void {
    mode.value = nextMode
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
    startScrollLeft = viewport.scrollLeft
    startScrollTop = viewport.scrollTop
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
    viewport.scrollLeft = startScrollLeft - (event.clientX - startX)
    viewport.scrollTop = startScrollTop - (event.clientY - startY)
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
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleWindowKeydown)
    window.removeEventListener('keyup', handleWindowKeyup)
    window.removeEventListener('blur', resetTemporaryMode)
  })

  return {
    mode,
    panEnabled,
    isPanning,
    setMode,
    handlePointerEnter,
    handlePointerLeave,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClickCapture,
  }
}
