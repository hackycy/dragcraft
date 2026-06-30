import { RootRenderer } from '@dragcraft/renderer'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import DcToolbar from './DcToolbar'

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
      handleCanvasDragOver,
      handleCanvasDragLeave,
      handleCanvasDrop,
      eventHooks,
      actionRegistry,
    } = ctx

    const rendererExtensions = computed(() => ({
      ...(extensions.rendererExtensions ?? {}),
    }))

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const nodeEl = target.closest('[data-node-id]') as HTMLElement | null
      if (!nodeEl || nodeEl.dataset.nodeId === 'root') {
        engine.store.selectNode(null)
      }
    }

    // Compute right boundary for toolbar: property panel's left edge
    const toolbarMaxRight = computed(() => {
      const canvas = document.querySelector('.dc-designer__panel--right') as HTMLElement | null
      return canvas?.getBoundingClientRect().left
    })

    const isDragging = computed(() => engine.store.dragTarget.value !== null)

    return () => h(
      'div',
      {
        class: ['dc-canvas', {
          'dc-canvas--dragging': isDragging.value,
          'dc-canvas--forbidden': isForbidden.value && isDragging.value,
        }],
        onDragover: handleCanvasDragOver,
        onDragleave: handleCanvasDragLeave,
        onDrop: handleCanvasDrop,
        onClick: handleClick,
      },
      [
        h(DcToolbar),
        h('div', { class: 'dc-canvas__content' }, [
          h(RootRenderer, {
            engine,
            componentMap,
            extensions: rendererExtensions.value,
            eventHooks,
            actionRegistry,
            dragOverNodeId,
            dragOverIndex,
            isForbidden,
            toolbarMaxRight,
          }),
        ]),
      ],
    )
  },
})
