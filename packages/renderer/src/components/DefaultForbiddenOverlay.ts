import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'

/**
 * Default forbidden overlay shown when a widget type cannot be dropped
 * (e.g., singleton widget already exists in the canvas).
 * Renders a semi-transparent red overlay with a ban icon and message.
 */
export default defineComponent({
  name: 'DcDefaultForbiddenOverlay',

  props: {
    widgetType: {
      type: String as PropType<string>,
      required: true,
    },
  },

  setup(props) {
    const { t } = useI18n()
    return () =>
      h('div', { class: 'dc-forbidden-overlay' }, [
        h('span', { class: 'dc-forbidden-overlay__icon' }, [
          h('svg', {
            'xmlns': 'http://www.w3.org/2000/svg',
            'width': '24',
            'height': '24',
            'viewBox': '0 0 24 24',
            'fill': 'none',
            'stroke': 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          }, [
            h('circle', { cx: '12', cy: '12', r: '10' }),
            h('line', { x1: '4.93', y1: '4.93', x2: '19.07', y2: '19.07' }),
          ]),
        ]),
        h('span', { class: 'dc-forbidden-overlay__text' }, t('forbidden.alreadyExists', `Cannot add ${props.widgetType} — this type already exists`)),
      ])
  },
})
