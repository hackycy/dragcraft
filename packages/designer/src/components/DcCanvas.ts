import { RootRenderer } from '@dragcraft/renderer'
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCanvasPan } from '../composables/useCanvasPan'
import { useDesignerContext } from '../context'
import DcCanvasControls from './DcCanvasControls'

export function centerCanvasTarget(viewport: HTMLElement, target: HTMLElement): void {
  const viewportRect = viewport.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  viewport.scrollLeft += targetRect.left + targetRect.width / 2 - (viewportRect.left + viewportRect.width / 2)
  viewport.scrollTop += targetRect.top + targetRect.height / 2 - (viewportRect.top + viewportRect.height / 2)
}

export default defineComponent({
  name: 'DcCanvas',

  setup() {
    const ctx = useDesignerContext()
    const {
      engine,
      componentMap,
      extensions,
      dragOverNodeId,
      dragOverIndex,
      isForbidden,
      forbiddenReason,
      handleCanvasDragOver,
      handleCanvasDragLeave,
      handleCanvasDrop,
      eventHooks,
      actionInterceptors,
      actionRegistry,
    } = ctx
    const viewportRef = ref<HTMLElement | null>(null)
    const contentRef = ref<HTMLElement | null>(null)
    const canvasPan = useCanvasPan(viewportRef)
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let observedTarget: HTMLElement | null = null
    let centerFrameId: number | null = null

    const rendererExtensions = computed(() => ({
      ...(extensions.rendererExtensions ?? {}),
    }))

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const nodeEl = target.closest('[data-node-id]') as HTMLElement | null
      if (!nodeEl || nodeEl.dataset.nodeId === 'root')
        engine.store.selectNode(null)
    }

    const isDragging = computed(() => engine.store.dragTarget.value !== null)

    function centerCurrentCanvasTarget(): void {
      const viewport = viewportRef.value
      const content = contentRef.value
      const target = content?.querySelector<HTMLElement>('[data-dc-toolbar-boundary]')
        ?? content?.querySelector<HTMLElement>('.dc-root-renderer')
      if (!viewport || !target)
        return

      centerCanvasTarget(viewport, target)
    }

    function scheduleCenter(): void {
      if (centerFrameId != null)
        cancelAnimationFrame(centerFrameId)
      centerFrameId = requestAnimationFrame(() => {
        centerFrameId = null
        centerCurrentCanvasTarget()
      })
    }

    function observeCanvasTarget(): void {
      const content = contentRef.value
      const nextTarget = content?.querySelector<HTMLElement>('[data-dc-toolbar-boundary]')
        ?? content?.querySelector<HTMLElement>('.dc-root-renderer')
        ?? null
      if (nextTarget === observedTarget)
        return
      if (observedTarget)
        resizeObserver?.unobserve(observedTarget)
      observedTarget = nextTarget
      if (observedTarget)
        resizeObserver?.observe(observedTarget)
      scheduleCenter()
    }

    onMounted(() => {
      const viewport = viewportRef.value
      const content = contentRef.value
      if (!viewport || !content)
        return

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(scheduleCenter)
        resizeObserver.observe(viewport)
      }
      if (typeof MutationObserver !== 'undefined') {
        mutationObserver = new MutationObserver(observeCanvasTarget)
        mutationObserver.observe(content, { childList: true, subtree: true })
      }
      nextTick(observeCanvasTarget)
    })

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      if (centerFrameId != null)
        cancelAnimationFrame(centerFrameId)
    })

    return () => h('div', {
      class: ['dc-canvas', {
        'dc-canvas--dragging': isDragging.value,
        'dc-canvas--forbidden': isForbidden.value && isDragging.value,
        'dc-canvas--hand': canvasPan.panEnabled.value,
        'dc-canvas--panning': canvasPan.isPanning.value,
      }],
    }, [
      h(DcCanvasControls, {
        interactionMode: canvasPan.mode.value,
        onModeChange: canvasPan.setMode,
        onResetView: scheduleCenter,
      }),
      h('div', {
        'ref': viewportRef,
        'class': 'dc-canvas__viewport',
        'data-dc-interaction-boundary': '',
        'onDragover': handleCanvasDragOver,
        'onDragleave': handleCanvasDragLeave,
        'onDrop': handleCanvasDrop,
        'onClick': handleClick,
        'onClickCapture': canvasPan.handleClickCapture,
        'onPointerdownCapture': canvasPan.handlePointerDown,
        'onPointerenter': canvasPan.handlePointerEnter,
        'onPointerleave': canvasPan.handlePointerLeave,
        'onPointermoveCapture': canvasPan.handlePointerMove,
        'onPointerupCapture': canvasPan.handlePointerUp,
        'onPointercancelCapture': canvasPan.handlePointerUp,
      }, [
        h('div', { ref: contentRef, class: 'dc-canvas__content' }, [
          h(RootRenderer, {
            engine,
            componentMap,
            extensions: rendererExtensions.value,
            eventHooks,
            actionInterceptors,
            actionRegistry,
            dragOverNodeId,
            dragOverIndex,
            isForbidden,
            forbiddenReason,
            interactionBoundary: viewportRef,
          }),
        ]),
      ]),
      h('div', {
        'class': 'dc-canvas__interaction-layer',
        'data-dc-canvas-interaction-layer': '',
      }),
    ])
  },
})
