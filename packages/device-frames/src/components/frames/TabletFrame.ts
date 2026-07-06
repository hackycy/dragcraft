import type { LayoutPlan } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { IconSignal, IconSignalBar } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { useFrameViewport } from '../frame-viewport'

/**
 * Tablet / iPad frame with minimal chrome and thin bezels.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcTabletFrame',

  props: {
    layoutPlan: {
      type: Object as PropType<LayoutPlan>,
      default: undefined,
    },
    chromeVNodes: {
      type: Array as PropType<VNode[]>,
      default: () => [],
    },
    layerVNodes: {
      type: Object as PropType<Record<string, VNode[]>>,
      default: () => ({}),
    },
    forbiddenOverlayVNode: {
      type: Object as PropType<VNode | null>,
      default: null,
    },
  },

  setup(props, { slots }) {
    const renderViewport = useFrameViewport(() => ({
      content: slots.default?.() ?? [],
      chromeVNodes: props.chromeVNodes,
      layerVNodes: props.layerVNodes,
      plan: props.layoutPlan,
    }))

    return () =>
      h('div', { 'class': 'dc-device-frame dc-device-frame--tablet', 'data-dc-toolbar-boundary': '' }, [
        // Status bar (iPad-style)
        h('div', { class: 'dc-device-frame__status-bar' }, [
          h('span', { class: 'dc-device-frame__status-time' }, '9:41'),
          h('span', { class: 'dc-device-frame__status-icons' }, [
            h('span', null, h(IconSignal, { size: 10 })),
            h('span', null, h(IconSignalBar, { size: 10 })),
          ]),
        ]),
        renderViewport(),
        props.forbiddenOverlayVNode,
      ])
  },
})
