import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

export default defineComponent({
  name: 'DcToolbar',

  setup() {
    const ctx = useDesignerContext()
    const { engine } = ctx

    const handleUndo = () => engine.history.undo()
    const handleRedo = () => engine.history.redo()

    return () => {
      // Read reactive dependency for undo/redo state
      void engine.store.schema.value

      return h('div', { class: 'dc-toolbar' }, [
        h('button', {
          class: [
            'dc-toolbar__btn',
            'dc-toolbar__btn--undo',
          ],
          onClick: handleUndo,
          disabled: !engine.history.canUndo(),
        }, 'Undo'),
        h('button', {
          class: [
            'dc-toolbar__btn',
            'dc-toolbar__btn--redo',
          ],
          onClick: handleRedo,
          disabled: !engine.history.canRedo(),
        }, 'Redo'),
      ])
    }
  },
})
