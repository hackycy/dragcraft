import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
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
    const handleChange = (e: Event) => {
      const selectEl = e.target as HTMLSelectElement
      const raw = selectEl.value
      // Try to find the original option value (may be non-string)
      const options = (props.field.props?.options as SelectOption[]) ?? []
      const matched = options.find(opt => String(opt.value) === raw)
      emit('update:modelValue', matched ? matched.value : raw)
    }

    return () => {
      const options = (props.field.props?.options as SelectOption[]) ?? []
      const placeholder = (props.field.props?.placeholder as string) ?? ''

      const children = []

      if (placeholder) {
        children.push(
          h('option', { value: '', disabled: true }, placeholder),
        )
      }

      for (const opt of options) {
        children.push(
          h('option', { value: String(opt.value) }, opt.label),
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
