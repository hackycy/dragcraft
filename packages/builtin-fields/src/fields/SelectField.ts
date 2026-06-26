import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'

interface SelectOption {
  label: string
  value: unknown
}

export default defineComponent({
  name: 'DcSelectField',

  props: {
    modelValue: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
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

    const handleChange = (e: Event) => {
      const selectEl = e.target as HTMLSelectElement
      const raw = selectEl.value
      // Try to find the original option value (may be non-string)
      const extra = props.field.props as Record<string, unknown> | undefined
      const options = (extra?.options as SelectOption[]) ?? []
      const matched = options.find(opt => String(opt.value) === raw)
      emit('update:modelValue', matched ? matched.value : raw)
    }

    return () => {
      const extra = props.field.props as Record<string, unknown> | undefined
      const options = (extra?.options as SelectOption[]) ?? []
      const rawPlaceholder = (extra?.placeholder as string) ?? ''
      const placeholder = props.field.placeholderKey
        ? t(props.field.placeholderKey, rawPlaceholder)
        : rawPlaceholder
      const optionPrefix = props.field.optionKeyPrefix

      const children = []

      if (placeholder) {
        children.push(
          h('option', { value: '', disabled: true }, placeholder),
        )
      }

      for (const opt of options) {
        const label = optionPrefix
          ? t(`${optionPrefix}.${opt.value}`, opt.label)
          : opt.label
        children.push(
          h('option', { value: String(opt.value) }, label),
        )
      }

      return h(
        'select',
        {
          class: 'dc-field-select',
          value: String(props.modelValue ?? ''),
          disabled: props.disabled,
          onChange: handleChange,
        },
        children,
      )
    }
  },
})
