import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const formSelectWidgetMeta: WidgetMeta = {
  type: 'form-select',
  title: '下拉选择',
  titleKey: 'widget.form-select.title',
  group: 'form',
  icon: 'select',
  defaultProps: {
    label: '标签',
    placeholder: '请选择',
    value: '',
    options: [
      { label: '选项一', value: '1' },
      { label: '选项二', value: '2' },
    ],
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
        titleKey: 'widget.form-select.form.basic.title',
        fields: [
          { key: 'label', label: '标签', labelKey: 'widget.form-select.field.label.label', component: 'input', defaultValue: '标签' },
          { key: 'placeholder', label: '占位文本', labelKey: 'widget.form-select.field.placeholder.label', component: 'input', defaultValue: '请选择' },
          { key: 'required', label: '必填', labelKey: 'widget.form-select.field.required.label', component: 'switch', defaultValue: false },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-select.field.disabled.label', component: 'switch', defaultValue: false },
        ],
      },
    ],
  },
}

export default defineComponent({
  name: 'DcFormSelectWidget',

  props: {
    label: {
      type: String as PropType<string>,
      default: '标签',
    },
    placeholder: {
      type: String as PropType<string>,
      default: '请选择',
    },
    value: {
      type: [String, Number] as PropType<string | number>,
      default: '',
    },
    options: {
      type: Array as PropType<Array<{ label: string, value: string | number }>>,
      default: () => [
        { label: '选项一', value: '1' },
        { label: '选项二', value: '2' },
      ],
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
      h('div', { class: 'dc-widget-form-select' }, [
        h('label', { class: 'dc-widget-form-select__label' }, [
          props.label,
          props.required ? h('span', { class: 'dc-widget-form-select__required' }, ' *') : null,
        ]),
        h(
          'select',
          {
            class: 'dc-widget-form-select__field',
            value: String(props.value),
            disabled: props.disabled,
          },
          [
            props.placeholder
              ? h('option', { value: '', disabled: true }, props.placeholder)
              : null,
            ...props.options.map(opt =>
              h('option', { value: String(opt.value) }, opt.label),
            ),
          ],
        ),
      ])
  },
})
