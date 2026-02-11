import type { PropType } from 'vue'
import type { FieldComponentMap, FormSchema } from './types'
import { defineComponent, h, toRef } from 'vue'
import { FormField } from './FormField'
import { useForm } from './useForm'

export const FormRenderer = defineComponent({
  name: 'FormRenderer',
  props: {
    schema: { type: Array as PropType<FormSchema>, required: true },
    modelValue: { type: Object as PropType<Record<string, any>>, required: true },
    components: { type: Object as PropType<FieldComponentMap>, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, expose }) {
    const form = useForm({
      schema: toRef(props, 'schema'),
      modelValue: toRef(props, 'modelValue'),
      disabled: toRef(props, 'disabled'),
    })

    function handleFieldUpdate(key: string, value: any): void {
      const newModel = form.setFieldValue(key, value)
      emit('update:modelValue', newModel)
    }

    expose({
      validate: form.validate,
      isValid: form.isValid,
    })

    return () => {
      const fields = form.visibleFields.value

      if (fields.length === 0) {
        return h('div', { class: 'dragcraft-form--empty' })
      }

      return h(
        'div',
        { class: 'dragcraft-form' },
        fields.map(field =>
          h(FormField, {
            'key': field.key,
            field,
            'modelValue': form.getFieldValue(field.key),
            'error': form.getFieldError(field.key),
            'disabled': toRef(props, 'disabled').value || field.disabled === true,
            'components': props.components,
            'onUpdate:modelValue': (value: any) => handleFieldUpdate(field.key, value),
          }),
        ),
      )
    }
  },
})
