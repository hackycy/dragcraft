import type { WidgetMeta } from '@dragcraft/core'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

interface OptionItem {
  label: string
  value: string | number
}

const defaultOptions: OptionItem[] = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
]

function renderRequired(required: boolean) {
  return required ? h('span', { class: 'pg-widget-form__required' }, '*') : null
}

export const formInputWidgetMeta: WidgetMeta = {
  type: 'form-input',
  title: '输入框',
  titleKey: 'widget.form-input.title',
  group: 'form',
  icon: 'input',
  defaultProps: {
    label: '标签',
    placeholder: '请输入',
    value: '',
    required: false,
    disabled: false,
  },
  defaultStyle: { width: '100%' },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.form-input.form.basic.title',
        fields: [
          { key: 'label', label: '标签', labelKey: 'widget.form-input.field.label.label', component: 'Input', defaultValue: '标签' },
          { key: 'placeholder', label: '占位文本', labelKey: 'widget.form-input.field.placeholder.label', component: 'Input', defaultValue: '请输入' },
          { key: 'value', label: '默认值', labelKey: 'widget.form-input.field.value.label', component: 'Input', defaultValue: '' },
          { key: 'required', label: '必填', labelKey: 'widget.form-input.field.required.label', component: 'Switch', defaultValue: false },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-input.field.disabled.label', component: 'Switch', defaultValue: false },
        ],
      },
    ],
  },
}

export const FormInputWidget = defineComponent({
  name: 'PlaygroundFormInputWidget',
  props: {
    label: { type: String as PropType<string>, default: '标签' },
    placeholder: { type: String as PropType<string>, default: '请输入' },
    value: { type: String as PropType<string>, default: '' },
    required: { type: Boolean as PropType<boolean>, default: false },
    disabled: { type: Boolean as PropType<boolean>, default: false },
  },
  setup(props) {
    return () =>
      h('label', { class: ['pg-widget-form', { 'pg-widget-form--disabled': props.disabled }] }, [
        h('span', { class: 'pg-widget-form__label' }, [props.label, renderRequired(props.required)]),
        h('input', {
          class: 'pg-widget-form__control',
          type: 'text',
          value: props.value,
          placeholder: props.placeholder,
          disabled: props.disabled,
          readonly: true,
        }),
      ])
  },
})

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
  defaultStyle: { width: '100%' },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.form-textarea.form.basic.title',
        fields: [
          { key: 'label', label: '标签', labelKey: 'widget.form-textarea.field.label.label', component: 'Input', defaultValue: '标签' },
          { key: 'placeholder', label: '占位文本', labelKey: 'widget.form-textarea.field.placeholder.label', component: 'Input', defaultValue: '请输入' },
          { key: 'value', label: '默认值', labelKey: 'widget.form-textarea.field.value.label', component: 'Textarea', defaultValue: '', componentProps: { rows: 2 } },
          { key: 'rows', label: '行数', labelKey: 'widget.form-textarea.field.rows.label', component: 'InputNumber', defaultValue: 3, componentProps: { min: 1, max: 20 } },
          { key: 'required', label: '必填', labelKey: 'widget.form-textarea.field.required.label', component: 'Switch', defaultValue: false },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-textarea.field.disabled.label', component: 'Switch', defaultValue: false },
        ],
      },
    ],
  },
}

export const FormTextareaWidget = defineComponent({
  name: 'PlaygroundFormTextareaWidget',
  props: {
    label: { type: String as PropType<string>, default: '标签' },
    placeholder: { type: String as PropType<string>, default: '请输入' },
    value: { type: String as PropType<string>, default: '' },
    rows: { type: Number as PropType<number>, default: 3 },
    required: { type: Boolean as PropType<boolean>, default: false },
    disabled: { type: Boolean as PropType<boolean>, default: false },
  },
  setup(props) {
    return () =>
      h('label', { class: ['pg-widget-form', { 'pg-widget-form--disabled': props.disabled }] }, [
        h('span', { class: 'pg-widget-form__label' }, [props.label, renderRequired(props.required)]),
        h('textarea', {
          class: 'pg-widget-form__control pg-widget-form__textarea',
          value: props.value,
          placeholder: props.placeholder,
          rows: props.rows,
          disabled: props.disabled,
          readonly: true,
        }),
      ])
  },
})

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
    options: defaultOptions,
    required: false,
    disabled: false,
  },
  defaultStyle: { width: '100%' },
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.form-select.form.basic.title',
        fields: [
          { key: 'label', label: '标签', labelKey: 'widget.form-select.field.label.label', component: 'Input', defaultValue: '标签' },
          { key: 'placeholder', label: '占位文本', labelKey: 'widget.form-select.field.placeholder.label', component: 'Input', defaultValue: '请选择' },
          { key: 'required', label: '必填', labelKey: 'widget.form-select.field.required.label', component: 'Switch', defaultValue: false },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-select.field.disabled.label', component: 'Switch', defaultValue: false },
        ],
      },
    ],
  },
}

export const FormSelectWidget = defineComponent({
  name: 'PlaygroundFormSelectWidget',
  props: {
    label: { type: String as PropType<string>, default: '标签' },
    placeholder: { type: String as PropType<string>, default: '请选择' },
    value: { type: [String, Number] as PropType<string | number>, default: '' },
    options: { type: Array as PropType<OptionItem[]>, default: () => defaultOptions },
    required: { type: Boolean as PropType<boolean>, default: false },
    disabled: { type: Boolean as PropType<boolean>, default: false },
  },
  setup(props) {
    return () => {
      const selected = props.options.find(option => String(option.value) === String(props.value))
      return h('label', { class: ['pg-widget-form', { 'pg-widget-form--disabled': props.disabled }] }, [
        h('span', { class: 'pg-widget-form__label' }, [props.label, renderRequired(props.required)]),
        h('div', {
          class: [
            'pg-widget-form__control',
            'pg-widget-form__select',
            { 'pg-widget-form__select--empty': !selected },
          ],
        }, [
          h('span', null, selected?.label ?? props.placeholder),
          h('span', { class: 'pg-widget-form__select-arrow' }, 'v'),
        ]),
      ])
    }
  },
})

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
          { key: 'label', label: '标签', labelKey: 'widget.form-checkbox.field.label.label', component: 'Input', defaultValue: '复选框' },
          { key: 'checked', label: '默认选中', labelKey: 'widget.form-checkbox.field.checked.label', component: 'Switch', defaultValue: false },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-checkbox.field.disabled.label', component: 'Switch', defaultValue: false },
        ],
      },
    ],
  },
}

export const FormCheckboxWidget = defineComponent({
  name: 'PlaygroundFormCheckboxWidget',
  props: {
    label: { type: String as PropType<string>, default: '复选框' },
    checked: { type: Boolean as PropType<boolean>, default: false },
    disabled: { type: Boolean as PropType<boolean>, default: false },
  },
  setup(props) {
    return () =>
      h('label', { class: ['pg-widget-choice', { 'pg-widget-choice--disabled': props.disabled }] }, [
        h('input', { type: 'checkbox', checked: props.checked, disabled: props.disabled, readonly: true }),
        h('span', { class: 'pg-widget-choice__mark' }),
        h('span', { class: 'pg-widget-choice__label' }, props.label),
      ])
  },
})

export const formRadioWidgetMeta: WidgetMeta = {
  type: 'form-radio-group',
  title: '单选组',
  titleKey: 'widget.form-radio-group.title',
  group: 'form',
  icon: 'radio',
  defaultProps: {
    label: '单选组',
    value: '',
    options: [
      { label: '选项 A', value: 'a' },
      { label: '选项 B', value: 'b' },
    ],
    direction: 'horizontal',
    disabled: false,
  },
  defaultStyle: {},
  formSchema: {
    sections: [
      {
        title: '基础设置',
        titleKey: 'widget.form-radio-group.form.basic.title',
        fields: [
          { key: 'label', label: '标签', labelKey: 'widget.form-radio-group.field.label.label', component: 'Input', defaultValue: '单选组' },
          {
            key: 'direction',
            label: '排列方向',
            labelKey: 'widget.form-radio-group.field.direction.label',
            optionKeyPrefix: 'widget.form-radio-group.field.direction.option',
            component: 'Select',
            defaultValue: 'horizontal',
            componentProps: { options: [{ label: '水平', value: 'horizontal' }, { label: '垂直', value: 'vertical' }] },
          },
          { key: 'disabled', label: '禁用', labelKey: 'widget.form-radio-group.field.disabled.label', component: 'Switch', defaultValue: false },
        ],
      },
    ],
  },
}

export const FormRadioWidget = defineComponent({
  name: 'PlaygroundFormRadioWidget',
  props: {
    label: { type: String as PropType<string>, default: '单选组' },
    value: { type: [String, Number] as PropType<string | number>, default: '' },
    options: {
      type: Array as PropType<OptionItem[]>,
      default: () => [
        { label: '选项 A', value: 'a' },
        { label: '选项 B', value: 'b' },
      ],
    },
    direction: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    disabled: { type: Boolean as PropType<boolean>, default: false },
  },
  setup(props) {
    return () =>
      h('div', { class: ['pg-widget-radio', { 'pg-widget-radio--disabled': props.disabled }] }, [
        h('div', { class: 'pg-widget-radio__label' }, props.label),
        h('div', { class: ['pg-widget-radio__group', `pg-widget-radio__group--${props.direction}`] }, props.options.map(option =>
          h('label', { class: 'pg-widget-radio__item', key: String(option.value) }, [
            h('input', {
              type: 'radio',
              checked: String(props.value) === String(option.value),
              disabled: props.disabled,
              readonly: true,
            }),
            h('span', { class: 'pg-widget-radio__dot' }),
            h('span', null, option.label),
          ]),
        )),
      ])
  },
})

export const formWidgetDefinitions = [
  { meta: formInputWidgetMeta, component: FormInputWidget },
  { meta: formTextareaWidgetMeta, component: FormTextareaWidget },
  { meta: formSelectWidgetMeta, component: FormSelectWidget },
  { meta: formCheckboxWidgetMeta, component: FormCheckboxWidget },
  { meta: formRadioWidgetMeta, component: FormRadioWidget },
]
