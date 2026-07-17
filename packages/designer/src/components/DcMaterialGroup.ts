import type { PropType } from 'vue'
import type { DesignerWidgetMeta } from '../types'
import { IconChevronDown } from '@dragcraft/icons'
import { defineComponent, h, ref } from 'vue'
import DcMaterialItem from './DcMaterialItem'

export default defineComponent({
  name: 'DcMaterialGroup',

  props: {
    title: {
      type: String as PropType<string>,
      required: true,
    },
    widgets: {
      type: Array as PropType<DesignerWidgetMeta[]>,
      required: true,
    },
  },

  setup(props) {
    const collapsed = ref(false)

    const toggleCollapse = () => {
      collapsed.value = !collapsed.value
    }

    return () => {
      const header = h(
        'button',
        {
          'type': 'button',
          'class': 'dc-material-group__header',
          'data-dc-part': 'header',
          'aria-expanded': !collapsed.value,
          'onClick': toggleCollapse,
        },
        [
          h('span', { 'class': 'dc-material-group__title', 'data-dc-part': 'title' }, props.title),
          h('span', {
            'class': collapsed.value
              ? 'dc-material-group__toggle dc-material-group__toggle--collapsed'
              : 'dc-material-group__toggle',
            'data-dc-part': 'toggle',
          }, [h(IconChevronDown, { size: 15 })]),
        ],
      )

      const body = collapsed.value
        ? null
        : h(
            'div',
            { 'class': 'dc-material-group__body', 'data-dc-part': 'body' },
            props.widgets.map(meta =>
              h(DcMaterialItem, { key: meta.type, meta }),
            ),
          )

      return h('div', {
        'class': [
          'dc-material-group',
          { 'dc-material-group--collapsed': collapsed.value },
        ],
        'data-dc-component': 'material-group',
        'data-dc-state': collapsed.value ? 'collapsed' : 'expanded',
      }, [header, body])
    }
  },
})
