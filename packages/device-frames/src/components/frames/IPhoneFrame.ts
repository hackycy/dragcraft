import type { DesignerSchema, LayoutPlan } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'
import { renderFrameViewport } from '../frame-slots'

/**
 * iPhone frame with Dynamic Island notch, status bar, and home indicator.
 * Status bar uses a 3-column grid layout: time (left) | Dynamic Island (center) | icons (right),
 * matching the real iPhone status bar layout.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcIPhoneFrame',

  props: {
    layoutPlan: {
      type: Object as PropType<LayoutPlan>,
      default: undefined,
    },
    schema: {
      type: Object as PropType<DesignerSchema>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
    return () =>
      h('div', { class: 'dc-device-frame dc-device-frame--iphone' }, [
        // Status bar: time | Dynamic Island | icons
        h('div', { class: 'dc-device-frame__status-bar' }, [
          // Left: time
          h('span', { class: 'dc-device-frame__status-time' }, '9:41'),
          // Center: Dynamic Island
          h('div', { class: 'dc-device-frame__notch dc-device-frame__notch--dynamic-island' }),
          // Right: cellular + wifi + battery
          h('span', { class: 'dc-device-frame__status-icons' }, [
            // Cellular signal (4 bars)
            h('span', { class: 'dc-device-frame__cellular' }, [
              h('span', { class: 'dc-device-frame__cellular-bar' }),
              h('span', { class: 'dc-device-frame__cellular-bar' }),
              h('span', { class: 'dc-device-frame__cellular-bar' }),
              h('span', { class: 'dc-device-frame__cellular-bar' }),
            ]),
            // WiFi icon (inline SVG)
            h('svg', {
              class: 'dc-device-frame__wifi',
              width: '15',
              height: '12',
              viewBox: '0 0 15 12',
              fill: 'currentColor',
            }, [
              h('circle', { cx: '7.5', cy: '10.5', r: '1.5' }),
              h('path', {
                'd': 'M5.1 7.6a3.5 3.5 0 014.8 0',
                'stroke': 'currentColor',
                'stroke-width': '1.6',
                'stroke-linecap': 'round',
                'fill': 'none',
              }),
              h('path', {
                'd': 'M2.3 4.8a7.2 7.2 0 0110.4 0',
                'stroke': 'currentColor',
                'stroke-width': '1.6',
                'stroke-linecap': 'round',
                'fill': 'none',
              }),
            ]),
            // Battery
            h('span', { class: 'dc-device-frame__battery' }, [
              h('span', { class: 'dc-device-frame__battery-level' }),
            ]),
          ]),
        ]),
        h('div', { class: 'dc-device-frame__viewport' }, renderFrameViewport(slots, props.layoutPlan, props.schema)),
        // Home indicator bar
        h('div', { class: 'dc-device-frame__home-indicator' }),
      ])
  },
})
