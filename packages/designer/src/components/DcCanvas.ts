import { RootRenderer } from '@dragcraft/renderer'
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCanvasView } from '../composables/useCanvasView'
import { useDesignerContext } from '../context'
import DcCanvasControls from './DcCanvasControls'

export default defineComponent({
  name: 'DcCanvas',

  setup() {
    const ctx = useDesignerContext()
    const {
      engine,
      componentMap,
      extensions,
      activeDestination,
      containerDropDecision,
      dragOverNodeId,
      dragOverIndex,
      isForbidden,
      forbiddenReason,
      handleCanvasDragOver,
      handleCanvasDragLeave,
      handleCanvasDrop,
      handleContainerDragOver,
      handleContainerDragLeave,
      handleContainerDrop,
      eventHooks,
      actionInterceptors,
      actionRegistry,
    } = ctx
    const viewportRef = ref<HTMLElement | null>(null)
    const stageRef = ref<HTMLElement | null>(null)
    const contentRef = ref<HTMLElement | null>(null)
    const hasToolbarBoundary = ref(false)
    const hasCanvasFitTarget = ref(false)
    const canvasView = useCanvasView(viewportRef, stageRef)
    let mutationObserver: MutationObserver | null = null
    let observedTarget: HTMLElement | null = null
    let observedFitTarget: HTMLElement | null = null
    let fitObserver: ResizeObserver | null = null
    let fitFrame: number | null = null

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

    function stopInitialFit(): void {
      fitObserver?.disconnect()
      fitObserver = null
      if (fitFrame !== null) {
        window.cancelAnimationFrame(fitFrame)
        fitFrame = null
      }
    }

    function observeInitialFit(target: HTMLElement): void {
      if (typeof ResizeObserver === 'undefined')
        return

      const viewport = viewportRef.value
      if (!viewport)
        return

      fitObserver = new ResizeObserver(() => {
        if (fitFrame !== null)
          return
        fitFrame = window.requestAnimationFrame(() => {
          fitFrame = null
          if (target !== observedFitTarget)
            return
          if (canvasView.fit())
            stopInitialFit()
        })
      })
      fitObserver.observe(viewport)
      fitObserver.observe(target)
    }

    function scheduleInitialFit(target: HTMLElement): void {
      stopInitialFit()
      fitFrame = window.requestAnimationFrame(() => {
        fitFrame = null
        if (target !== observedFitTarget)
          return
        if (canvasView.fit())
          return
        observeInitialFit(target)
      })
    }

    function observeCanvasTarget(): void {
      const content = contentRef.value
      const nextTarget = content?.querySelector<HTMLElement>('[data-dc-toolbar-boundary]')
        ?? content?.querySelector<HTMLElement>('.dc-root-renderer')
        ?? null
      const nextFitTarget = content?.querySelector<HTMLElement>('[data-dc-canvas-fit="contain"]') ?? null
      hasToolbarBoundary.value = nextTarget?.hasAttribute('data-dc-toolbar-boundary') ?? false

      if (nextTarget !== observedTarget) {
        if (nextTarget && observedTarget)
          canvasView.center()
        observedTarget = nextTarget
      }

      if (nextFitTarget === observedFitTarget)
        return

      const previousFitTarget = observedFitTarget
      stopInitialFit()
      observedFitTarget = nextFitTarget
      hasCanvasFitTarget.value = nextFitTarget !== null
      canvasView.setFitTarget(nextFitTarget)
      if (nextFitTarget)
        scheduleInitialFit(nextFitTarget)
      else if (previousFitTarget)
        canvasView.reset()
    }

    onMounted(() => {
      const content = contentRef.value
      if (!content)
        return

      if (typeof MutationObserver !== 'undefined') {
        mutationObserver = new MutationObserver(observeCanvasTarget)
        mutationObserver.observe(content, { childList: true, subtree: true })
      }
      nextTick(observeCanvasTarget)
    })

    onBeforeUnmount(() => {
      mutationObserver?.disconnect()
      stopInitialFit()
    })

    return () => {
      const themeStates = [
        isDragging.value ? 'dragging' : null,
        isForbidden.value && isDragging.value ? 'forbidden' : null,
        canvasView.panEnabled.value ? 'hand' : null,
        canvasView.isPanning.value ? 'panning' : null,
      ].filter(Boolean).join(' ') || undefined

      return h('div', {
        'class': ['dc-canvas', {
          'dc-canvas--dragging': isDragging.value,
          'dc-canvas--forbidden': isForbidden.value && isDragging.value,
          'dc-canvas--hand': canvasView.panEnabled.value,
          'dc-canvas--panning': canvasView.isPanning.value,
        }],
        'data-dc-component': 'canvas',
        'data-dc-state': themeStates,
      }, [
        h(DcCanvasControls, {
          interactionMode: canvasView.mode.value,
          showZoomControls: hasCanvasFitTarget.value,
          viewScale: canvasView.scale.value,
          canZoomIn: canvasView.canZoomIn.value,
          canZoomOut: canvasView.canZoomOut.value,
          onModeChange: canvasView.setMode,
          onZoomIn: canvasView.zoomIn,
          onZoomOut: canvasView.zoomOut,
          onFitView: canvasView.fit,
          onResetView: canvasView.center,
        }),
        h('div', {
          'ref': viewportRef,
          'class': 'dc-canvas__viewport',
          'data-dc-part': 'viewport',
          'data-dc-interaction-boundary': '',
          'onDragover': handleCanvasDragOver,
          'onDragleave': handleCanvasDragLeave,
          'onDrop': handleCanvasDrop,
          'onClick': handleClick,
          'onClickCapture': canvasView.handleClickCapture,
          'onPointerdownCapture': canvasView.handlePointerDown,
          'onPointerenter': canvasView.handlePointerEnter,
          'onPointerleave': canvasView.handlePointerLeave,
          'onPointermoveCapture': canvasView.handlePointerMove,
          'onPointerupCapture': canvasView.handlePointerUp,
          'onPointercancelCapture': canvasView.handlePointerUp,
        }, [
          h('div', {
            'ref': stageRef,
            'class': 'dc-canvas__stage',
            'data-dc-part': 'stage',
            'data-dc-canvas-stage': '',
            'style': {
              '--_dc-canvas-pan-x': `${canvasView.offset.value.x}px`,
              '--_dc-canvas-pan-y': `${canvasView.offset.value.y}px`,
              '--_dc-canvas-snap-x': `${canvasView.pixelSnap.value.x}px`,
              '--_dc-canvas-snap-y': `${canvasView.pixelSnap.value.y}px`,
              '--_dc-canvas-view-scale': String(canvasView.scale.value),
            },
          }, [
            h('div', {
              'ref': contentRef,
              'class': ['dc-canvas__content', { 'dc-canvas__content--bounded': hasToolbarBoundary.value }],
              'data-dc-part': 'content',
            }, [
              h(RootRenderer, {
                engine,
                componentMap,
                extensions: rendererExtensions.value,
                eventHooks,
                actionInterceptors,
                actionRegistry,
                activeDestination,
                containerDropDecision,
                onContainerDragOver: handleContainerDragOver,
                onContainerDragLeave: handleContainerDragLeave,
                onContainerDrop: handleContainerDrop,
                dragOverNodeId,
                dragOverIndex,
                isForbidden,
                forbiddenReason,
                interactionBoundary: viewportRef,
                viewScale: canvasView.scale,
              }),
            ]),
          ]),
        ]),
        h('div', {
          'class': 'dc-canvas__interaction-layer',
          'data-dc-part': 'interaction-layer',
          'data-dc-canvas-interaction-layer': '',
        }),
      ])
    }
  },
})
