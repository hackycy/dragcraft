import type { PropType } from 'vue'
import type { FieldComponentMap, FormFieldSchema } from './types'
import { defineComponent, h } from 'vue'

export const FormField = defineComponent({
  name: 'FormField',
  props: {
    field: { type: Object as PropType<FormFieldSchema>, required: true },
    modelValue: { type: null, required: true },
    error: { type: [String, null] as PropType<string | null>, default: null },
    disabled: { type: Boolean, default: false },
    components: { type: Object as PropType<FieldComponentMap>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const component = props.components[props.field.type]

      if (!component) {
        return h('div', { class: 'dragcraft-form-field--missing' },
          `No component for field type: "${props.field.type}"`)
      }

      return h(component, {
        field: props.field,
        modelValue: props.modelValue,
        error: props.error,
        disabled: props.disabled,
        'onUpdate:modelValue': (value: any) => emit('update:modelValue', value),
      })
    }
  },
})
