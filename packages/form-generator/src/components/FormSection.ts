import type { PropType } from 'vue'
import type { SectionSchema } from '../types'
import { defineComponent, h, ref } from 'vue'
import FormField from './FormField'

export default defineComponent({
  name: 'DcFormSection',

  props: {
    section: {
      type: Object as PropType<SectionSchema>,
      required: true,
    },
  },

  setup(props) {
    const collapsed = ref(props.section.collapsed ?? false)

    const toggleCollapse = () => {
      collapsed.value = !collapsed.value
    }

    return () => {
      const section = props.section

      const header = h(
        'div',
        {
          class: 'dc-form-section__header',
          onClick: toggleCollapse,
        },
        [
          h('span', { class: 'dc-form-section__title' }, section.title),
          h(
            'span',
            { class: 'dc-form-section__toggle' },
            collapsed.value ? '+' : '-',
          ),
        ],
      )

      const body = collapsed.value
        ? null
        : h(
            'div',
            { class: 'dc-form-section__body' },
            section.fields.map(field =>
              h(FormField, { key: field.key, field }),
            ),
          )

      return h(
        'div',
        { class: 'dc-form-section' },
        [header, body],
      )
    }
  },
})
