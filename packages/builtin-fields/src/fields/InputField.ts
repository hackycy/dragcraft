import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
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
    const { t } = useI18n()

    const handleInput = (e: Event) => {
      emit('update:modelValue', (e.target as HTMLInputElement).value)
    }

    return () => {
      const extra = props.field.props as Record<string, unknown> | undefined
      const rawPlaceholder = (extra?.placeholder as string) ?? ''
      const placeholder = props.field.placeholderKey
        ? t(props.field.placeholderKey, rawPlaceholder)
        : rawPlaceholder

      return h('input', {
        type: 'text',
        class: 'dc-field-input',
        value: props.modelValue ?? '',
        disabled: props.disabled,
        placeholder,
        onInput: handleInput,
      })
    }
  },
})
