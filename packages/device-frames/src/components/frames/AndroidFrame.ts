import type { LayoutPlan, StyleValueMap } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { IconNavBack, IconNavHome, IconNavRecent, IconSignal, IconSignalBar } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { useFrameViewport } from '../frame-viewport'

/**
 * Android phone frame with status bar and bottom navigation bar.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcAndroidFrame',

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
      h('div', { 'class': 'dc-device-frame dc-device-frame--android', 'data-dc-toolbar-boundary': '' }, [
        // Status bar
        h('div', { class: 'dc-device-frame__status-bar' }, [
          h('span', { class: 'dc-device-frame__status-time' }, '12:00'),
          h('span', { class: 'dc-device-frame__status-icons' }, [
            h('span', null, h(IconSignal, { size: 10 })),
            h('span', null, h(IconSignalBar, { size: 10 })),
          ]),
        ]),
        renderViewport(),
        // Android navigation bar (back / home / recent)
        h('div', { class: 'dc-device-frame__nav-bar' }, [
          h('span', { class: 'dc-device-frame__nav-btn' }, h(IconNavBack, { size: 12 })),
          h('span', { class: 'dc-device-frame__nav-btn dc-device-frame__nav-btn--home' }, h(IconNavHome, { size: 12 })),
          h('span', { class: 'dc-device-frame__nav-btn' }, h(IconNavRecent, { size: 12 })),
        ]),
        props.forbiddenOverlayVNode,
      ])
  },
})
