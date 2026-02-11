import type { FormFieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export const FieldSwitch = defineComponent({
  name: 'FieldSwitch',
  props: {
    field: { type: Object as PropType<FormFieldSchema>, required: true },
    modelValue: { type: Boolean, default: false },
    error: { type: [String, null] as PropType<string | null>, default: null },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      return h('div', { class: 'field-switch' }, [
        h('label', { class: 'field-switch__label' }, [
          h('input', {
            class: 'field-switch__control',
            type: 'checkbox',
            checked: props.modelValue,
            disabled: props.disabled,
            onChange: (e: Event) => {
              const target = e.target as HTMLInputElement
              emit('update:modelValue', target.checked)
            },
          }),
          h('span', { class: 'field-switch__text' }, props.field.label),
        ]),
      ])
    }
  },
})
