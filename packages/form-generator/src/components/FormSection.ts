import type { PropType } from 'vue'
import type { SectionSchema } from '../types'
import { useI18n } from '@dragcraft/i18n'
import { IconChevronDown } from '@dragcraft/icons'
import { defineComponent, h, ref, watch } from 'vue'
import FormField from './FormField'

export default defineComponent({
  name: 'DcFormSection',

  props: {
    section: {
      type: Object as PropType<SectionSchema>,
      required: true,
    },
    onToggle: {
      type: Function as PropType<(collapsed: boolean) => void>,
      default: undefined,
    },
  },

  setup(props) {
    const { t } = useI18n()
    const collapsed = ref(props.section.collapsed ?? false)

    watch(
      () => props.section.collapsed,
      (val) => {
        if (val !== undefined)
          collapsed.value = val
      },
    )

    const toggleCollapse = () => {
      collapsed.value = !collapsed.value
      props.onToggle?.(collapsed.value)
    }

    return () => {
      const section = props.section
      const columns = section.columns ?? 1

      const header = h(
        'button',
        {
          'type': 'button',
          'class': 'dc-form-section__header',
          'data-dc-part': 'header',
          'aria-expanded': !collapsed.value,
          'onClick': toggleCollapse,
        },
        [
          h('span', { 'class': 'dc-form-section__title', 'data-dc-part': 'title' }, section.titleKey ? t(section.titleKey, section.title) : section.title),
          h('span', {
            'class': collapsed.value
              ? 'dc-form-section__toggle dc-form-section__toggle--collapsed'
              : 'dc-form-section__toggle',
            'data-dc-part': 'toggle',
          }, [h(IconChevronDown, { size: 15 })]),
        ],
      )

      if (collapsed.value) {
        return h('div', {
          'class': 'dc-form-section',
          'data-dc-component': 'form-section',
          'data-dc-state': 'collapsed',
        }, [header])
      }

      const bodyClass = ['dc-form-section__body']
      const bodyStyle: Record<string, string> = {}

      if (columns > 1) {
        bodyClass.push('dc-form-section--grid')
        bodyStyle['--_dc-columns'] = String(columns)
      }

      const body = h(
        'div',
        { 'class': bodyClass, 'style': bodyStyle, 'data-dc-part': 'body' },
        section.fields.map(field =>
          h(FormField, { key: field.key, field }),
        ),
      )

      return h(
        'div',
        {
          'class': 'dc-form-section',
          'data-dc-component': 'form-section',
          'data-dc-state': 'expanded',
        },
        [header, body],
      )
    }
  },
})
