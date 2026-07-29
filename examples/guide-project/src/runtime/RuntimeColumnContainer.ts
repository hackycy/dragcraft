import type { SchemaNode } from '@dragcraft/designer'
import type { PropType } from 'vue'
import type { RuntimeRegions } from './registry'
import { defineComponent, h } from 'vue'

export const RuntimeColumnContainer = defineComponent({
  name: 'GuideRuntimeColumnContainer',
  props: {
    node: { type: Object as PropType<SchemaNode>, required: true },
    variant: { type: String, default: 'single' },
    regions: {
      type: Object as PropType<RuntimeRegions>,
      required: true,
    },
  },
  setup(props) {
    const renderRegion = (regionId: string) => h('section', {
      class: 'guide-runtime-column-container__region',
    }, props.regions[regionId] ?? [])

    return () => h('div', {
      class: {
        'guide-runtime-column-container': true,
        'guide-runtime-column-container--split': props.variant === 'split',
      },
      style: {
        ...props.node.style?.surface,
        gap: `${Number(props.node.props.gap ?? 12)}px`,
      },
    }, props.variant === 'split'
      ? [renderRegion('left'), renderRegion('right')]
      : [renderRegion('content')])
  },
})
