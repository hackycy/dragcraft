import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcDefaultWidgetFallback',

  props: {
    nodeId: {
      type: String as PropType<string>,
      required: true,
    },
    nodeType: {
      type: String as PropType<string>,
      default: 'unknown',
    },
  },

  setup(props) {
    return () =>
      h(
        'div',
        { class: 'dc-widget-fallback' },
        `Unknown widget: ${props.nodeType}`,
      )
  },
})
