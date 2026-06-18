import type { ToolbarSlotAPI } from '../types'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

export default defineComponent({
  name: 'DcToolbar',

  setup() {
    const ctx = useDesignerContext()
    const { engine, extensions } = ctx

    // Build the toolbar slot API once (functions are stable references)
    const api: ToolbarSlotAPI = {
      undo: () => engine.history.undo(),
      redo: () => engine.history.redo(),
      canUndo: () => engine.history.canUndo(),
      canRedo: () => engine.history.canRedo(),
      execute: engine.execute,
      engine,
    }

    return () => {
      const renderer = extensions.toolbarRenderer
      if (!renderer) {
        return null
      }

      // Read reactive dependency so canUndo/canRedo reflect current state
      void engine.store.schema.value

      return h('div', {
        class: 'dc-toolbar',
        onClick: (e: MouseEvent) => e.stopPropagation(),
      }, [
        renderer(api),
      ])
    }
  },
})
