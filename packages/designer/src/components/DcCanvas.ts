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

    return () => h(
      'div',
      {
        class: 'dc-canvas',
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
          }),
        ]),
      ],
    )
  },
})
