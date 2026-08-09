import type { NodeDefinition } from '@dragcraft/designer'
import type { PropType } from 'vue'
import type { RuntimeRegions } from './registry'
import { defineComponent, h } from 'vue'

export const RuntimeColumnContainer = defineComponent({
  name: 'GuideRuntimeColumnContainer',
  props: {
    node: { type: Object as PropType<NodeDefinition>, required: true },
    regions: {
      type: Object as PropType<RuntimeRegions>,
      required: true,
    },
  },
  setup(props) {
    const surfaceStyle = () => {
      const surface = props.node.style?.surface
      return surface !== null && typeof surface === 'object' && !Array.isArray(surface)
        ? surface
        : undefined
    }
    const renderRegion = (regionId: string) => h('section', {
      class: 'guide-runtime-column-container__region',
    }, props.regions[regionId] ?? [])

    return () => h('div', {
      class: 'guide-runtime-column-container',
      style: {
        ...surfaceStyle(),
        gap: `${Number(props.node.props.gap ?? 12)}px`,
      },
    }, [renderRegion('content')])
  },
})
