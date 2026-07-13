import type { Component, PropType } from 'vue'
import { computed, defineComponent, h } from 'vue'
import { useContainerRuntime } from '../container-runtime'
import WidgetRenderer from './WidgetRenderer'

export default defineComponent({
  name: 'DcContainerRegionOutlet',
  inheritAttrs: false,
  props: {
    regionId: { type: String, required: true },
    as: { type: [String, Object] as PropType<string | Component>, default: 'div' },
  },
  setup(props, { attrs }) {
    const runtime = useContainerRuntime()
    const definition = computed(() =>
      runtime.regionDefinitions.value.find(item => item.id === props.regionId),
    )

    return () => h(props.as, {
      ...attrs,
      'class': ['dc-container-region', attrs.class],
      'data-dc-container-id': runtime.nodeId.value,
      'data-dc-container-region': props.regionId,
      'role': attrs.role ?? 'group',
      'aria-label': attrs['aria-label'] ?? definition.value?.title ?? props.regionId,
    }, runtime.getRegionNodes(props.regionId).map(node => h(WidgetRenderer, {
      key: node.id,
      node,
      owner: {
        kind: 'container',
        containerId: runtime.nodeId.value,
        regionId: props.regionId,
      },
    })))
  },
})
