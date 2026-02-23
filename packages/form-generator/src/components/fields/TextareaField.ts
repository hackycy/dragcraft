import type { PropType } from 'vue'
import type { FieldSchema } from '../../types'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcTextareaField',

  props: {
    modelValue: {
      type: String as PropType<string>,
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
      emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
    }

    return () =>
      h('textarea', {
        class: 'dc-field-textarea',
        value: props.modelValue ?? '',
        disabled: props.disabled,
        rows: (props.field.props?.rows as number) ?? 3,
        placeholder: (props.field.props?.placeholder as string) ?? '',
        onInput: handleInput,
      })
  },
})
