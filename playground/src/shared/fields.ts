import { ArrayField } from '@dragcraft/builtin-fields'
import { defineComponent, h } from 'vue'
import NavbarTitleField from '../fields/NavbarTitleField'

export const InputField = defineComponent({
  name: 'InputField',
  props: { field: { type: Object, required: true }, modelValue: { type: [String, Number], default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'text',
      value: props.modelValue,
      placeholder: (props.field as Record<string, unknown>).placeholder as string ?? '',
      style: 'width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;box-sizing:border-box;',
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
    })
  },
})

export const NumberField = defineComponent({
  name: 'NumberField',
  props: { field: { type: Object, required: true }, modelValue: { type: Number, default: 0 } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'number',
      value: props.modelValue,
      style: 'width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;font-size:13px;box-sizing:border-box;',
      onInput: (e: Event) => emit('update:modelValue', Number((e.target as HTMLInputElement).value)),
    })
  },
})

export const ColorField = defineComponent({
  name: 'ColorField',
  props: { field: { type: Object, required: true }, modelValue: { type: String, default: '#000000' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'color',
      value: props.modelValue,
      style: 'width:48px;height:28px;border:1px solid #d9d9d9;border-radius:4px;cursor:pointer;',
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
    })
  },
})

export const SliderField = defineComponent({
  name: 'SliderField',
  props: { field: { type: Object, required: true }, modelValue: { type: Number, default: 0 } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const s = props.field as Record<string, unknown>
    return () => h('input', {
      type: 'range',
      value: props.modelValue,
      min: (s.props as Record<string, unknown>)?.min ?? 0,
      max: (s.props as Record<string, unknown>)?.max ?? 100,
      style: 'width:100%;',
      onInput: (e: Event) => emit('update:modelValue', Number((e.target as HTMLInputElement).value)),
    })
  },
})

export const SwitchField = defineComponent({
  name: 'SwitchField',
  props: { field: { type: Object, required: true }, modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('label', {
        style: 'display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;user-select:none;',
      }, [
        h('div', {
          style: `position:relative;width:36px;height:20px;border-radius:10px;background:${props.modelValue ? '#1677ff' : '#d9d9d9'};transition:background 0.2s;cursor:pointer;`,
          onClick: () => emit('update:modelValue', !props.modelValue),
        }, [
          h('div', {
            style: `position:absolute;top:2px;${props.modelValue ? 'left:18px' : 'left:2px'};width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s;`,
          }),
        ]),
        h('span', { style: 'color:#666;' }, props.modelValue ? '已锁定' : '未锁定'),
      ])
  },
})

export const IconPickerField = defineComponent({
  name: 'IconPickerField',
  props: {
    field: { type: Object, required: true },
    modelValue: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const icons = ['#', 'B', '%', '?', '!', '*', '@', '&']
    return () =>
      h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap;' }, icons.map(icon =>
        h('button', {
          key: icon,
          style: `width:32px;height:32px;border:1px solid ${props.modelValue === icon ? '#1677ff' : '#d9d9d9'};border-radius:4px;background:${props.modelValue === icon ? '#e6f4ff' : '#fff'};cursor:pointer;font-size:14px;`,
          onClick: () => emit('update:modelValue', icon),
        }, icon),
      ))
  },
})

export const playgroundFieldMap = {
  'input': InputField,
  'number': NumberField,
  'color': ColorField,
  'slider': SliderField,
  'switch': SwitchField,
  'icon-picker': IconPickerField,
  'array': ArrayField,
  'navbar-title': NavbarTitleField,
}
