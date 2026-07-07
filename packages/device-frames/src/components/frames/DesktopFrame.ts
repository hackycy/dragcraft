import type { LayoutPlan, StyleValueMap } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { defineComponent, h } from 'vue'
import { useFrameViewport } from '../frame-viewport'

/**
 * Desktop browser chrome frame with title bar, traffic lights, and URL bar.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcDesktopFrame',

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
    surfaceStyle: {
      type: Object as PropType<StyleValueMap>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
    const renderViewport = useFrameViewport(() => ({
      content: slots.default?.() ?? [],
      chromeVNodes: props.chromeVNodes,
      layerVNodes: props.layerVNodes,
      plan: props.layoutPlan,
      surfaceStyle: props.surfaceStyle,
    }))

    return () =>
      h('div', { 'class': 'dc-device-frame dc-device-frame--desktop', 'data-dc-toolbar-boundary': '' }, [
        // Browser title bar
        h('div', { class: 'dc-device-frame__title-bar' }, [
          // Traffic light dots
          h('div', { class: 'dc-device-frame__traffic-lights' }, [
            h('span', { class: 'dc-device-frame__traffic-dot dc-device-frame__traffic-dot--close' }),
            h('span', { class: 'dc-device-frame__traffic-dot dc-device-frame__traffic-dot--minimize' }),
            h('span', { class: 'dc-device-frame__traffic-dot dc-device-frame__traffic-dot--maximize' }),
          ]),
          // URL bar
          h('div', { class: 'dc-device-frame__url-bar' }, 'localhost:5173'),
        ]),
        renderViewport(),
        props.forbiddenOverlayVNode,
      ])
  },
})
