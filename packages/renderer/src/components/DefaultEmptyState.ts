import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

/**
 * Default empty canvas state component.
 * Displayed when the canvas has no widgets and no drag operation is active.
 */
export default defineComponent({
  name: 'DcDefaultEmptyState',

  props: {
    isDragOver: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  setup(props) {
    return () =>
      h('div', {
        class: [
          'dc-empty-state',
          { 'dc-empty-state--drag-over': props.isDragOver },
        ],
      }, [
        h('div', { class: 'dc-empty-state__icon' }, '\u271A'),
        h('div', { class: 'dc-empty-state__text' }, '拖拽组件到这里'),
      ])
  },
})
