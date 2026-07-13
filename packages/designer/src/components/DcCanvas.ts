import { RootRenderer } from '@dragcraft/renderer'
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCanvasPan } from '../composables/useCanvasPan'
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
    const contentRef = ref<HTMLElement | null>(null)
    const canvasPan = useCanvasPan(viewportRef)
    let mutationObserver: MutationObserver | null = null
    let observedTarget: HTMLElement | null = null

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

    function observeCanvasTarget(): void {
      const content = contentRef.value
      const nextTarget = content?.querySelector<HTMLElement>('[data-dc-toolbar-boundary]')
        ?? content?.querySelector<HTMLElement>('.dc-root-renderer')
        ?? null

      if (nextTarget && observedTarget && nextTarget !== observedTarget)
        canvasPan.reset()
      if (!nextTarget || nextTarget === observedTarget)
        return
      observedTarget = nextTarget
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
        onResetView: canvasPan.reset,
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
        h('div', {
          'class': 'dc-canvas__stage',
          'data-dc-canvas-stage': '',
          'style': {
            '--dc-canvas-pan-x': `${canvasPan.offset.value.x}px`,
            '--dc-canvas-pan-y': `${canvasPan.offset.value.y}px`,
          },
        }, [
          h('div', { ref: contentRef, class: 'dc-canvas__content' }, [
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
            }),
          ]),
        ]),
      ]),
      h('div', {
        'class': 'dc-canvas__interaction-layer',
        'data-dc-canvas-interaction-layer': '',
      }),
    ])
  },
})
