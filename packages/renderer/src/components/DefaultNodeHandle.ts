import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

/**
 * Default selection handle component for widgets with mask=false.
 * Renders a small handle on hover that allows selecting the widget.
 */
export default defineComponent({
  name: 'DcDefaultNodeHandle',

  props: {
    nodeId: {
      type: String,
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    onSelect: {
      type: Function as PropType<(e: MouseEvent) => void>,
      required: true,
    },
  },

  setup(props) {
    return () =>
      h('div', {
        class: 'dc-node__handle',
        onClick: props.onSelect,
        title: '选中组件',
      })
  },
})
