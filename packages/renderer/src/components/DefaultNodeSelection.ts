import type { NodeOwner } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { NodeSelectionProjection } from '../selection-presentation'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcDefaultNodeSelection',

  props: {
    nodeId: { type: String, required: true },
    nodeType: { type: String, required: true },
    owner: { type: Object as PropType<NodeOwner>, required: true },
    projection: { type: Object as PropType<NodeSelectionProjection>, required: true },
  },

  setup(props) {
    return () => h('div', {
      'class': 'dc-node__selection-outline',
      'aria-hidden': 'true',
    }, props.projection.kind === 'root-segment'
      ? [
          h('span', { class: 'dc-node__selection-edge dc-node__selection-edge--block-start' }),
          h('span', { class: 'dc-node__selection-edge dc-node__selection-edge--inline-end' }),
          h('span', { class: 'dc-node__selection-edge dc-node__selection-edge--block-end' }),
          h('span', { class: 'dc-node__selection-edge dc-node__selection-edge--inline-start' }),
        ]
      : undefined)
  },
})
