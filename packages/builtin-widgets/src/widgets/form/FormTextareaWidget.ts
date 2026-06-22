import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const formTextareaWidgetMeta: WidgetMeta = {
  type: 'form-textarea',
  title: '多行文本',
  titleKey: 'widget.form-textarea.title',
  group: 'form',
  icon: 'textarea',
  defaultProps: {
    label: '标签',
    placeholder: '请输入',
    value: '',
    rows: 3,
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
        titleKey: 'widget.form-textarea.form.basic.title',
        fields: [
          { key: 'label', label: '标签', labelKey: 'widget.form-textarea.field.label.label', component: 'input', defaultValue: '标签' },
          { key: 'placeholder', label: '占位文本', labelKey: 'widget.form-textarea.field.placeholder.label', component: 'input', defaultValue: '请输入' },
          { key: 'value', label: '默认值', labelKey: 'widget.form-textarea.field.value.label', component: 'textarea', defaultValue: '', props: { rows: 2 } },
          { key: 'rows', label: '行数', labelKey: 'widget.form-textarea.field.rows.label', component: 'number', defaultValue: 3, props: { min: 1, max: 20 } },
          { key: 'required', label: '必填', labelKey: 'widget.form-textarea.field.required.label', component: 'switch', defaultValue: false },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-textarea.field.disabled.label', component: 'switch', defaultValue: false },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcFormTextareaWidget',

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
    rows: {
      type: Number as PropType<number>,
      default: 3,
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
      h('div', { class: 'dc-widget-form-textarea' }, [
        h('label', { class: 'dc-widget-form-textarea__label' }, [
          props.label,
          props.required ? h('span', { class: 'dc-widget-form-textarea__required' }, ' *') : null,
        ]),
        h('textarea', {
          class: 'dc-widget-form-textarea__field',
          placeholder: props.placeholder,
          value: props.value,
          rows: props.rows,
          disabled: props.disabled,
        }),
      ])
  },
})
