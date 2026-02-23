import type { SchemaNode } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { defineComponent, h } from 'vue'
import ContainerRenderer from './ContainerRenderer'
import WidgetRenderer from './WidgetRenderer'

export default defineComponent({
  name: 'DcNodeRenderer',

  props: {
    node: {
      type: Object as PropType<SchemaNode>,
      required: true,
    },
  },

  setup(props) {
    return (): VNode => {
      const { node } = props

      if (node.nodeType === 'container') {
        return h(ContainerRenderer, { key: node.id, node })
      }

      return h(WidgetRenderer, { key: node.id, node })
    }
  },
})
