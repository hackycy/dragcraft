import type { PropType } from 'vue'
import type { FieldSchema } from '../../types'
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

    return () =>
      h('input', {
        type: 'range',
        class: 'dc-field-slider',
        value: props.modelValue ?? 0,
        disabled: props.disabled,
        min: (props.field.props?.min as number) ?? 0,
        max: (props.field.props?.max as number) ?? 100,
        step: (props.field.props?.step as number) ?? 1,
        onInput: handleInput,
      })
  },
})
