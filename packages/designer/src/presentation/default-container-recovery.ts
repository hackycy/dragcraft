import type { PropType } from 'vue'
import type { NodeOwner } from './semantic'
import { defineComponent, h } from 'vue'
import { usePresentationContext } from './context'
import NodeHost from './node-host'

export default defineComponent({
  name: 'DcDefaultContainerRecovery',
  props: {
    containerId: { type: String, required: true },
    regionIds: { type: Array as PropType<readonly string[]>, required: true },
    code: { type: String, required: true },
  },
  setup(props) {
    const ctx = usePresentationContext()
    return () => h('div', {
      'class': 'dc-unresolved-container',
      'data-dc-component': 'container-recovery',
      'data-dc-diagnostic-code': props.code,
      'data-dc-container-id': props.containerId,
    }, props.regionIds.map((regionId) => {
      const owner: NodeOwner = { kind: 'container', containerId: props.containerId, regionId }
      const nodes = ctx.session.document.getRegionNodes(props.containerId, regionId)
      return h('div', {
        'key': regionId,
        'class': 'dc-container-region dc-container-region--unresolved',
        'data-dc-component': 'container-region',
        'data-dc-state': 'unresolved',
        'data-dc-container-id': props.containerId,
        'data-dc-container-region': regionId,
        'role': 'group',
        'aria-label': regionId,
      }, nodes.map(node => h(NodeHost, { key: node.id, node, owner })))
    }))
  },
})
