import type { PropType } from 'vue'
import type { PresentationNode } from './types'
import { defineComponent, h } from 'vue'
import { usePresentationContext } from './context'
import DefaultContainerRecovery from './default-container-recovery'
import { resolveContainerRegions } from './material-presentation'

export default defineComponent({
  name: 'DcDefaultContainerFallback',
  props: {
    node: {
      type: Object as PropType<PresentationNode>,
      required: true,
    },
  },
  setup(props) {
    const ctx = usePresentationContext()
    const regions = resolveContainerRegions(ctx.session, props.node)
    return () => h(DefaultContainerRecovery, {
      containerId: props.node.id,
      regionIds: regions.map(region => region.id),
      code: 'CONTAINER_MATERIAL_UNRESOLVED',
    })
  },
})
