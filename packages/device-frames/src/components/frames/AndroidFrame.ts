import { defineComponent, h } from 'vue'

/**
 * Android phone frame with status bar and bottom navigation bar.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcAndroidFrame',

  setup(_, { slots }) {
    return () =>
      h('div', { class: 'dc-device-frame dc-device-frame--android' }, [
        // Status bar
        h('div', { class: 'dc-device-frame__status-bar' }, [
          h('span', { class: 'dc-device-frame__status-time' }, '12:00'),
          h('span', { class: 'dc-device-frame__status-icons' }, [
            h('span', null, '\u25D0'),
            h('span', null, '\u25AC'),
          ]),
        ]),
        // Content area
        h('div', { class: 'dc-device-frame__content dc-container-shell' }, slots.default?.()),
        // Android navigation bar (back / home / recent)
        h('div', { class: 'dc-device-frame__nav-bar' }, [
          h('span', { class: 'dc-device-frame__nav-btn' }, '\u25C1'),
          h('span', { class: 'dc-device-frame__nav-btn dc-device-frame__nav-btn--home' }, '\u25CB'),
          h('span', { class: 'dc-device-frame__nav-btn' }, '\u25A1'),
        ]),
      ])
  },
})
