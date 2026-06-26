import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
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
    const { t } = useI18n()

    const handleInput = (e: Event) => {
      emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
    }

    return () => {
      const extra = props.field.props as Record<string, unknown> | undefined
      const rawPlaceholder = (extra?.placeholder as string) ?? ''
      const placeholder = props.field.placeholderKey
        ? t(props.field.placeholderKey, rawPlaceholder)
        : rawPlaceholder

      return h('textarea', {
        class: 'dc-field-textarea',
        value: props.modelValue ?? '',
        disabled: props.disabled,
        rows: (extra?.rows as number) ?? 3,
        placeholder,
        onInput: handleInput,
      })
    }
  },
})
