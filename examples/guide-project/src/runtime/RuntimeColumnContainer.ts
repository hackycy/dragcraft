import type { NodeDefinition } from '@dragcraft/designer'
import type { PropType } from 'vue'
import type { RuntimeRegions } from './registry'
import { defineComponent, h } from 'vue'

export const RuntimeColumnContainer = defineComponent({
  name: 'GuideRuntimeColumnContainer',
  props: {
    node: { type: Object as PropType<NodeDefinition>, required: true },
    regions: { type: Object as PropType<RuntimeRegions>, required: true },
  },
  setup: props => () => h('div', {
    class: 'guide-runtime-column-container',
    style: { gap: `${Number(props.node.props.gap ?? 12)}px` },
  }, [
    h('section', { class: 'guide-runtime-column-container__region' }, props.regions.content ?? []),
  ]),
})
