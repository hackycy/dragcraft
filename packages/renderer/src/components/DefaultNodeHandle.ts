import type { NodeOwner } from '@dragcraft/core'
import type { PropType } from 'vue'
import { IconComponent } from '@dragcraft/icons'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'

/**
 * Default semantic selection handle for unmasked widgets and resolved containers.
 */
export default defineComponent({
  name: 'DcDefaultNodeHandle',

  props: {
    nodeId: {
      type: String,
      required: true,
    },
    nodeType: {
      type: String,
      required: true,
    },
    owner: {
      type: Object as PropType<NodeOwner>,
      required: true,
    },
    onSelect: {
      type: Function as PropType<(e: MouseEvent) => void>,
      required: true,
    },
  },

  setup(props) {
    const { t } = useI18n()
    return () => {
      const label = t('canvas.node-handle', '选中组件')
      return h('button', {
        'type': 'button',
        'class': 'dc-node__handle',
        'onClick': props.onSelect,
        'title': label,
        'aria-label': label,
      }, [
        h('span', { class: 'dc-node__handle-surface' }, [
          h('span', { 'class': 'dc-node__handle-icon', 'aria-hidden': 'true' }, [
            h(IconComponent, { size: 12 }),
          ]),
        ]),
      ])
    }
  },
})
