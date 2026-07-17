import type { PropType } from 'vue'
import { IconPlus } from '@dragcraft/icons'
import { useI18n } from '@dragcraft/utils'
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
    const { t } = useI18n()
    return () =>
      h('div', {
        'class': [
          'dc-empty-state',
          { 'dc-empty-state--drag-over': props.isDragOver },
        ],
        'data-dc-component': 'empty-state',
        'data-dc-state': props.isDragOver ? 'drag-over' : undefined,
      }, [
        h('div', { 'class': 'dc-empty-state__icon', 'data-dc-part': 'icon' }, h(IconPlus, { size: 32 })),
        h('div', { 'class': 'dc-empty-state__text', 'data-dc-part': 'text' }, t('canvas.empty', '拖拽组件到这里')),
      ])
  },
})
