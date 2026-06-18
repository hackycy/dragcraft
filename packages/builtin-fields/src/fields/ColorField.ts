import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcColorField',

  props: {
    modelValue: {
      type: String as PropType<string>,
      default: '#000000',
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
        type: 'color',
        class: 'dc-field-color',
        value: props.modelValue ?? '#000000',
        disabled: props.disabled,
        onInput: handleInput,
      })
  },
})
