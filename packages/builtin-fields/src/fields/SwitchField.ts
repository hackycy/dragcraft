import type { FieldSchema } from '@dragcraft/form-generator'
import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcSwitchField',

  props: {
    modelValue: {
      type: Boolean as PropType<boolean>,
      default: false,
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
      emit('update:modelValue', (e.target as HTMLInputElement).checked)
    }

    return () =>
      h('input', {
        type: 'checkbox',
        class: 'dc-field-switch',
        checked: props.modelValue ?? false,
        disabled: props.disabled,
        onChange: handleChange,
      })
  },
})
