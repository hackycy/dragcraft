import type { PropType } from 'vue'
import type { NodeOwner } from './semantic'
import type { RendererNode } from './types'
import { defineComponent, h } from 'vue'
import { useRendererContext } from './context'
import NodeHost from './node-host'

export default defineComponent({
  name: 'DcDefaultContainerFallback',
  props: {
    node: {
      type: Object as PropType<RendererNode>,
      required: true,
    },
  },
  setup(props) {
    const ctx = useRendererContext()
    const plan = ctx.session.materials.resolveContainer(props.node)
    const regions = plan.ok ? plan.plan.regions : []
    return () => h('div', {
      'class': 'dc-unresolved-container',
      'data-dc-component': 'unresolved-container',
      'data-dc-unresolved-container': props.node.id,
    }, regions.map((region) => {
      const regionId = region.definition.id
      const nodes = ctx.session.document.getRegionNodes(props.node.id, regionId)
      const owner: NodeOwner = {
        kind: 'container',
        containerId: props.node.id,
        regionId,
      }
      return h('div', {
        'key': regionId,
        'class': 'dc-container-region dc-container-region--unresolved',
        'data-dc-component': 'container-region',
        'data-dc-state': 'unresolved',
        'data-dc-container-id': props.node.id,
        'data-dc-container-region': regionId,
        'role': 'group',
        'aria-label': regionId,
      }, nodes.map(node => h(ctx.nodeRenderer ?? NodeHost, {
        key: node.id,
        node,
        owner,
      })))
    }))
  },
})
