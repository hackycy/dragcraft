import { RootRenderer } from '@dragcraft/renderer'
import { computed, defineComponent, h, ref } from 'vue'
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

    return () => h('div', {
      class: ['dc-canvas', {
        'dc-canvas--dragging': isDragging.value,
        'dc-canvas--forbidden': isForbidden.value && isDragging.value,
      }],
    }, [
      h(DcCanvasControls),
      h('div', {
        'ref': viewportRef,
        'class': 'dc-canvas__viewport',
        'data-dc-interaction-boundary': '',
        'onDragover': handleCanvasDragOver,
        'onDragleave': handleCanvasDragLeave,
        'onDrop': handleCanvasDrop,
        'onClick': handleClick,
      }, [
        h('div', { class: 'dc-canvas__content' }, [
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
