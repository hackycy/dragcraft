import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcSliderField',

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
      emit('update:modelValue', Number.parseFloat((e.target as HTMLInputElement).value))
    }

    return () => {
      const extra = props.field.props as Record<string, unknown> | undefined
      return h('input', {
        type: 'range',
        class: 'dc-field-slider',
        value: props.modelValue ?? 0,
        disabled: props.disabled,
        min: (extra?.min as number) ?? 0,
        max: (extra?.max as number) ?? 100,
        step: (extra?.step as number) ?? 1,
        onInput: handleInput,
      })
    }
  },
})
