import type { NodeOwner, SchemaNode } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'
import WidgetRenderer from './WidgetRenderer'

export default defineComponent({
  name: 'DcDefaultContainerFallback',
  props: {
    node: {
      type: Object as PropType<SchemaNode>,
      required: true,
    },
  },
  setup(props) {
    return () => h('div', {
      'class': 'dc-unresolved-container',
      'data-dc-unresolved-container': props.node.id,
    }, Object.entries(props.node.container?.regions ?? {}).map(([regionId, nodes]) => {
      const owner: NodeOwner = {
        kind: 'container',
        containerId: props.node.id,
        regionId,
      }
      return h('div', {
        'key': regionId,
        'class': 'dc-container-region dc-container-region--unresolved',
        'data-dc-container-id': props.node.id,
        'data-dc-container-region': regionId,
        'role': 'group',
        'aria-label': regionId,
      }, nodes.map(node => h(WidgetRenderer, {
        key: node.id,
        node,
        owner,
      })))
    }))
  },
})
