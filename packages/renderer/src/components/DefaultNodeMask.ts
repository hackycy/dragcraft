import type { NodeOwner } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

/**
 * Default mask overlay component for widgets with mask=true.
 * Renders a transparent overlay that blocks widget interaction
 * and captures clicks for selection.
 */
export default defineComponent({
  name: 'DcDefaultNodeMask',

  props: {
    nodeId: {
      type: String,
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    owner: {
      type: Object as PropType<NodeOwner>,
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
        class: 'dc-node__mask',
        onClick: props.onSelect,
      })
  },
})
