import type { FieldSchema, JsonObject, MaterialDefinition } from '@dragcraft/designer'
import type { Component, PropType } from 'vue'
import { defineMaterial } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'
import { localizedSection } from './localized-section'

interface OptionItem extends JsonObject {
  label: string
  value: string | number
}

const defaultOptions: OptionItem[] = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
]
const protectedRemoval = { remove: 'confirmation-required' as const }

function requiredMark(required: boolean) {
  return required ? h('span', { class: 'pg-widget-form__required' }, '*') : null
}

export const FormInputWidget = defineComponent({
  name: 'PlaygroundFormInputWidget',
  props: {
    label: { type: String, default: '标签' },
    placeholder: { type: String, default: '请输入' },
    value: { type: String, default: '' },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup: props => () => h('label', { class: ['pg-widget-form', { 'pg-widget-form--disabled': props.disabled }] }, [
    h('span', { class: 'pg-widget-form__label' }, [props.label, requiredMark(props.required)]),
    h('input', { class: 'pg-widget-form__control', disabled: props.disabled, placeholder: props.placeholder, readonly: true, value: props.value }),
  ]),
})

export const FormTextareaWidget = defineComponent({
  name: 'PlaygroundFormTextareaWidget',
  props: {
    label: { type: String, default: '标签' },
    placeholder: { type: String, default: '请输入' },
    value: { type: String, default: '' },
    rows: { type: Number, default: 3 },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup: props => () => h('label', { class: ['pg-widget-form', { 'pg-widget-form--disabled': props.disabled }] }, [
    h('span', { class: 'pg-widget-form__label' }, [props.label, requiredMark(props.required)]),
    h('textarea', { class: 'pg-widget-form__control pg-widget-form__textarea', disabled: props.disabled, placeholder: props.placeholder, readonly: true, rows: props.rows, value: props.value }),
  ]),
})

export const FormSelectWidget = defineComponent({
  name: 'PlaygroundFormSelectWidget',
  props: {
    label: { type: String, default: '标签' },
    placeholder: { type: String, default: '请选择' },
    value: { type: [String, Number] as PropType<string | number>, default: '' },
    options: { type: Array as PropType<OptionItem[]>, default: () => defaultOptions },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup: props => () => {
    const selected = props.options.find(option => String(option.value) === String(props.value))
    return h('label', { class: ['pg-widget-form', { 'pg-widget-form--disabled': props.disabled }] }, [
      h('span', { class: 'pg-widget-form__label' }, [props.label, requiredMark(props.required)]),
      h('div', { class: ['pg-widget-form__control', 'pg-widget-form__select', { 'pg-widget-form__select--empty': !selected }] }, [
        h('span', selected?.label ?? props.placeholder),
        h('span', { class: 'pg-widget-form__select-arrow' }, 'v'),
      ]),
    ])
  },
})

export const FormCheckboxWidget = defineComponent({
  name: 'PlaygroundFormCheckboxWidget',
  props: {
    label: { type: String, default: '复选框' },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup: props => () => h('label', { class: ['pg-widget-choice', { 'pg-widget-choice--disabled': props.disabled }] }, [
    h('input', { checked: props.checked, disabled: props.disabled, readonly: true, type: 'checkbox' }),
    h('span', { class: 'pg-widget-choice__mark' }),
    h('span', { class: 'pg-widget-choice__label' }, props.label),
  ]),
})

export const FormRadioWidget = defineComponent({
  name: 'PlaygroundFormRadioWidget',
  props: {
    label: { type: String, default: '单选组' },
    value: { type: [String, Number] as PropType<string | number>, default: '' },
    options: { type: Array as PropType<OptionItem[]>, default: () => defaultOptions },
    direction: { type: String, default: 'horizontal' },
    disabled: { type: Boolean, default: false },
  },
  setup: props => () => h('div', { class: ['pg-widget-radio', { 'pg-widget-radio--disabled': props.disabled }] }, [
    h('div', { class: 'pg-widget-radio__label' }, props.label),
    h('div', { class: ['pg-widget-radio__group', `pg-widget-radio__group--${props.direction}`] }, props.options.map(option => h('label', {
      key: String(option.value),
      class: 'pg-widget-radio__item',
    }, [
      h('input', { checked: String(props.value) === String(option.value), disabled: props.disabled, readonly: true, type: 'radio' }),
      h('span', { class: 'pg-widget-radio__dot' }),
      h('span', option.label),
    ]))),
  ]),
})

function formMaterial(
  type: string,
  title: string,
  preview: Component,
  defaultProps: JsonObject,
  fields: FieldSchema[],
): MaterialDefinition {
  return defineMaterial({
    type,
    schema: { defaultProps },
    authoring: { policy: protectedRemoval },
    panel: { title, titleKey: `widget.${type}.title`, group: 'form', icon: title.slice(0, 1) },
    inspector: { formSchema: { sections: [localizedSection(type, 'basic', { title: '基础设置', fields })] } },
    presentation: { kind: 'visual', preview },
  })
}

export const formMaterials: readonly MaterialDefinition[] = [
  formMaterial('form-input', '输入框', FormInputWidget, { label: '标签', placeholder: '请输入', value: '', required: false, disabled: false }, [
    { key: 'label', label: '标签', component: 'Input' },
    { key: 'placeholder', label: '占位文本', component: 'Input' },
    { key: 'value', label: '默认值', component: 'Input' },
    { key: 'required', label: '必填', component: 'Switch' },
    { key: 'disabled', label: '禁用', component: 'Switch' },
  ]),
  formMaterial('form-textarea', '多行文本', FormTextareaWidget, { label: '标签', placeholder: '请输入', value: '', rows: 3, required: false, disabled: false }, [
    { key: 'label', label: '标签', component: 'Input' },
    { key: 'placeholder', label: '占位文本', component: 'Input' },
    { key: 'value', label: '默认值', component: 'Textarea', componentProps: { rows: 2 } },
    { key: 'rows', label: '行数', component: 'InputNumber', componentProps: { min: 1, max: 20 } },
    { key: 'required', label: '必填', component: 'Switch' },
    { key: 'disabled', label: '禁用', component: 'Switch' },
  ]),
  formMaterial('form-select', '下拉选择', FormSelectWidget, { label: '标签', placeholder: '请选择', value: '', options: defaultOptions, required: false, disabled: false }, [
    { key: 'label', label: '标签', component: 'Input' },
    { key: 'placeholder', label: '占位文本', component: 'Input' },
    { key: 'required', label: '必填', component: 'Switch' },
    { key: 'disabled', label: '禁用', component: 'Switch' },
  ]),
  formMaterial('form-checkbox', '复选框', FormCheckboxWidget, { label: '复选框', checked: false, disabled: false }, [
    { key: 'label', label: '标签', component: 'Input' },
    { key: 'checked', label: '默认选中', component: 'Switch' },
    { key: 'disabled', label: '禁用', component: 'Switch' },
  ]),
  formMaterial('form-radio-group', '单选组', FormRadioWidget, { label: '单选组', value: '', options: defaultOptions, direction: 'horizontal', disabled: false }, [
    { key: 'label', label: '标签', component: 'Input' },
    { key: 'direction', label: '方向', component: 'Select', componentProps: { options: [{ label: '水平', value: 'horizontal' }, { label: '垂直', value: 'vertical' }] } },
    { key: 'disabled', label: '禁用', component: 'Switch' },
  ]),
]
