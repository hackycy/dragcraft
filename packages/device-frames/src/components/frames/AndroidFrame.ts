import type { LayoutPlan } from '@dragcraft/core'
import type { PropType } from 'vue'
import { IconNavBack, IconNavHome, IconNavRecent, IconSignal, IconSignalBar } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { renderFrameViewport } from '../frame-slots'

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
  },

  setup(props, { slots }) {
    return () =>
      h('div', { class: 'dc-device-frame dc-device-frame--android' }, [
        // Status bar
        h('div', { class: 'dc-device-frame__status-bar' }, [
          h('span', { class: 'dc-device-frame__status-time' }, '12:00'),
          h('span', { class: 'dc-device-frame__status-icons' }, [
            h('span', null, h(IconSignal, { size: 10 })),
            h('span', null, h(IconSignalBar, { size: 10 })),
          ]),
        ]),
        h('div', { class: 'dc-device-frame__viewport' }, renderFrameViewport(slots, props.layoutPlan)),
        // Android navigation bar (back / home / recent)
        h('div', { class: 'dc-device-frame__nav-bar' }, [
          h('span', { class: 'dc-device-frame__nav-btn' }, h(IconNavBack, { size: 12 })),
          h('span', { class: 'dc-device-frame__nav-btn dc-device-frame__nav-btn--home' }, h(IconNavHome, { size: 12 })),
          h('span', { class: 'dc-device-frame__nav-btn' }, h(IconNavRecent, { size: 12 })),
        ]),
      ])
  },
})
