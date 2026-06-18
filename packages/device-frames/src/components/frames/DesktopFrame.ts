import { defineComponent, h } from 'vue'

/**
 * Desktop browser chrome frame with title bar, traffic lights, and URL bar.
 * Renders children via the default slot inside the content area.
 */
export default defineComponent({
  name: 'DcDesktopFrame',

  setup(_, { slots }) {
    return () =>
      h('div', { class: 'dc-device-frame dc-device-frame--desktop' }, [
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
        // Content area
        h('div', { class: 'dc-device-frame__content dc-container-shell' }, slots.default?.()),
      ])
  },
})
