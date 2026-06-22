import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const formCheckboxWidgetMeta: WidgetMeta = {
  type: 'form-checkbox',
  title: '复选框',
  titleKey: 'widget.form-checkbox.title',
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
        titleKey: 'widget.form-checkbox.form.basic.title',
        fields: [
          { key: 'label', label: '标签', labelKey: 'widget.form-checkbox.field.label.label', component: 'input', defaultValue: '复选框' },
          { key: 'checked', label: '默认选中', labelKey: 'widget.form-checkbox.field.checked.label', component: 'switch', defaultValue: false },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-checkbox.field.disabled.label', component: 'switch', defaultValue: false },
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
