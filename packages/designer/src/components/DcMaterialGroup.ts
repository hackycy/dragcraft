import type { PropType } from 'vue'
import type { DesignerWidgetMeta } from '../types'
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
        'div',
        {
          class: 'dc-material-group__header',
          onClick: toggleCollapse,
        },
        [
          h('span', { class: 'dc-material-group__title' }, props.title),
          h('span', {
            class: [
              'dc-material-group__toggle',
              { 'dc-material-group__toggle--collapsed': collapsed.value },
            ],
          }),
        ],
      )

      const body = collapsed.value
        ? null
        : h(
            'div',
            { class: 'dc-material-group__body' },
            props.widgets.map(meta =>
              h(DcMaterialItem, { key: meta.type, meta }),
            ),
          )

      return h('div', {
        class: [
          'dc-material-group',
          { 'dc-material-group--collapsed': collapsed.value },
        ],
      }, [header, body])
    }
  },
})
