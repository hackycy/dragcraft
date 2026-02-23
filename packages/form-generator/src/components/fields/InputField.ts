import type { PropType } from 'vue'
import type { FieldSchema } from '../../types'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcInputField',

  props: {
    modelValue: {
      type: [String, Number] as PropType<string | number>,
      default: '',
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
      emit('update:modelValue', (e.target as HTMLInputElement).value)
    }

    return () =>
      h('input', {
        type: 'text',
        class: 'dc-field-input',
        value: props.modelValue ?? '',
        disabled: props.disabled,
        placeholder: (props.field.props?.placeholder as string) ?? '',
        onInput: handleInput,
      })
  },
})
