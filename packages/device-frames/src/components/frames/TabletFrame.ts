import type { DesignerSchema, LayoutPlan } from '@dragcraft/core'
import type { PropType } from 'vue'
import { IconSignal, IconSignalBar } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { renderFrameViewport } from '../frame-slots'

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
    schema: {
      type: Object as PropType<DesignerSchema>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
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
        h('div', { class: 'dc-device-frame__viewport' }, renderFrameViewport(slots, props.layoutPlan, props.schema)),
      ])
  },
})
