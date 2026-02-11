import { defineComponent, h } from 'vue'

export const Toolbar = defineComponent({
  name: 'Toolbar',
  props: {
    canUndo: { type: Boolean, default: false },
    canRedo: { type: Boolean, default: false },
    hasSelection: { type: Boolean, default: false },
  },
  emits: ['undo', 'redo', 'delete'],
  setup(props, { emit, slots }) {
    return () => {
      return h('div', { class: 'dragcraft-toolbar' }, [
        h('button', {
          class: 'dragcraft-toolbar__btn',
          disabled: !props.canUndo,
          onClick: () => emit('undo'),
        }, 'Undo'),
        h('button', {
          class: 'dragcraft-toolbar__btn',
          disabled: !props.canRedo,
          onClick: () => emit('redo'),
        }, 'Redo'),
        h('button', {
          class: 'dragcraft-toolbar__btn',
          disabled: !props.hasSelection,
          onClick: () => emit('delete'),
        }, 'Delete'),
        slots.default ? slots.default() : null,
      ])
    }
  },
})
