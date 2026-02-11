import type { FormFieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const FieldSelect = defineComponent({
  name: 'FieldSelect',
  props: {
    field: { type: Object as PropType<FormFieldSchema>, required: true },
    modelValue: { type: null, default: '' },
    error: { type: [String, null] as PropType<string | null>, default: null },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const options = props.field.options ?? []

      return h('div', { class: 'field-select' }, [
        h('label', { class: 'field-select__label' }, props.field.label),
        h('select', {
          class: 'field-select__control',
          value: props.modelValue,
          disabled: props.disabled,
          onChange: (e: Event) => {
            const target = e.target as HTMLSelectElement
            emit('update:modelValue', target.value)
          },
        }, [
          h('option', { value: '', disabled: true }, props.field.placeholder ?? 'Select...'),
          ...options.map(opt =>
            h('option', { value: opt.value }, opt.label),
          ),
        ]),
        props.error
          ? h('span', { class: 'field-select__error' }, props.error)
          : null,
      ])
    }
  },
})
