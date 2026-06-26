import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcNumberField',

  props: {
    modelValue: {
      type: Number as PropType<number>,
      default: 0,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    field: {
      type: Object as PropType<FieldSchema>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const handleInput = (e: Event) => {
      const raw = (e.target as HTMLInputElement).value
      const num = Number.parseFloat(raw)
      emit('update:modelValue', Number.isNaN(num) ? 0 : num)
    }

    return () => {
      const extra = props.field.props as Record<string, unknown> | undefined
      return h('input', {
        type: 'number',
        class: 'dc-field-number',
        value: props.modelValue ?? 0,
        disabled: props.disabled,
        min: extra?.min as number | undefined,
        max: extra?.max as number | undefined,
        step: extra?.step as number | undefined,
        placeholder: (extra?.placeholder as string) ?? '',
        onInput: handleInput,
      })
    }
  },
})
