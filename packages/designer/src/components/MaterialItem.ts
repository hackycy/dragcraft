import type { PropType } from 'vue'
import type { DesignerWidgetDefinition } from '../types'
import { defineComponent, h } from 'vue'

export const MaterialItem = defineComponent({
  name: 'MaterialItem',
  props: {
    definition: {
      type: Object as PropType<DesignerWidgetDefinition>,
      required: true,
    },
  },
  emits: ['add'],
  setup(props, { emit }) {
    return () => {
      return h(
        'div',
        {
          class: 'dragcraft-material-item',
          onClick: () => emit('add', props.definition),
        },
        [
          props.definition.icon
            ? h('span', { class: 'dragcraft-material-item__icon' }, props.definition.icon)
            : null,
          h('span', { class: 'dragcraft-material-item__label' }, props.definition.label),
        ],
      )
    }
  },
})
