import type { DesignerSchema, LayoutPlan } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'
import { renderFrameViewport } from '../frame-slots'

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
    schema: {
      type: Object as PropType<DesignerSchema>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
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
        h('div', { class: 'dc-device-frame__viewport' }, renderFrameViewport(slots, props.layoutPlan, props.schema)),
      ])
  },
})
