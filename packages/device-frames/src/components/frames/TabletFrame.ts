import { IconSignal, IconSignalBar } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'

/**
 * Tablet / iPad frame with minimal chrome and thin bezels.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcTabletFrame',

  setup(_, { slots }) {
    return () =>
      h('div', { class: 'dc-device-frame dc-device-frame--tablet' }, [
        // Status bar (iPad-style)
        h('div', { class: 'dc-device-frame__status-bar' }, [
          h('span', { class: 'dc-device-frame__status-time' }, '9:41'),
          h('span', { class: 'dc-device-frame__status-icons' }, [
            h('span', null, h(IconSignal, { size: 10 })),
            h('span', null, h(IconSignalBar, { size: 10 })),
          ]),
        ]),
        // Content area
        h('div', { class: 'dc-device-frame__content dc-container-shell' }, slots.default?.()),
      ])
  },
})
