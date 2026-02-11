import type { FormFieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const FieldInput = defineComponent({
  name: 'FieldInput',
  props: {
    field: { type: Object as PropType<FormFieldSchema>, required: true },
    modelValue: { type: [String, Number, null] as PropType<string | number | null>, default: '' },
    error: { type: [String, null] as PropType<string | null>, default: null },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      return h('div', { class: 'field-input' }, [
        h('label', { class: 'field-input__label' }, props.field.label),
        h('input', {
          class: ['field-input__control', props.error ? 'field-input__control--error' : ''],
          type: props.field.type === 'number' ? 'number' : 'text',
          value: props.modelValue ?? '',
          placeholder: props.field.placeholder ?? '',
          disabled: props.disabled,
          min: props.field.min,
          max: props.field.max,
          step: props.field.step,
          onInput: (e: Event) => {
            const target = e.target as HTMLInputElement
            const value = props.field.type === 'number' ? Number(target.value) : target.value
            emit('update:modelValue', value)
          },
        }),
        props.error
          ? h('span', { class: 'field-input__error' }, props.error)
          : null,
      ])
    }
  },
})
