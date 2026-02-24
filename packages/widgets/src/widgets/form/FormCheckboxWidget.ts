import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const formCheckboxWidgetMeta: WidgetMeta = {
  type: 'form-checkbox',
  title: '复选框',
  group: 'form',
  icon: 'checkbox',
  defaultProps: {
    label: '复选框',
    checked: false,
    disabled: false,
  },
  defaultStyle: {},
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          { key: 'label', label: '标签', component: 'input', defaultValue: '复选框' },
          { key: 'checked', label: '默认选中', component: 'switch', defaultValue: false },
          { key: 'disabled', label: '禁用', component: 'switch', defaultValue: false },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcFormCheckboxWidget',

  props: {
    label: {
      type: String as PropType<string>,
      default: '复选框',
    },
    checked: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    disabled: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  setup(props) {
    return () =>
      h('label', { class: 'dc-widget-form-checkbox' }, [
        h('input', {
          class: 'dc-widget-form-checkbox__input',
          type: 'checkbox',
          checked: props.checked,
          disabled: props.disabled,
        }),
        h('span', { class: 'dc-widget-form-checkbox__label' }, props.label),
      ])
  },
})
