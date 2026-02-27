import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const formInputWidgetMeta: WidgetMeta = {
  type: 'form-input',
  title: '输入框',
  group: 'form',
  icon: 'input',
  defaultProps: {
    label: '标签',
    placeholder: '请输入',
    value: '',
    required: false,
    disabled: false,
  },
  defaultStyle: {
    width: '100%',
  },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        fields: [
          { key: 'label', label: '标签', component: 'input', defaultValue: '标签' },
          { key: 'placeholder', label: '占位文本', component: 'input', defaultValue: '请输入' },
          { key: 'value', label: '默认值', component: 'input', defaultValue: '' },
          { key: 'required', label: '必填', component: 'switch', defaultValue: false },
          { key: 'disabled', label: '禁用', component: 'switch', defaultValue: false },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcFormInputWidget',

  props: {
    label: {
      type: String as PropType<string>,
      default: '标签',
    },
    placeholder: {
      type: String as PropType<string>,
      default: '请输入',
    },
    value: {
      type: String as PropType<string>,
      default: '',
    },
    required: {
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
      h('div', { class: 'dc-widget-form-input' }, [
        h('label', { class: 'dc-widget-form-input__label' }, [
          props.label,
          props.required ? h('span', { class: 'dc-widget-form-input__required' }, ' *') : null,
        ]),
        h('input', {
          class: 'dc-widget-form-input__field',
          type: 'text',
          placeholder: props.placeholder,
          value: props.value,
          disabled: props.disabled,
        }),
      ])
  },
})
