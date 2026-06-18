import type { PropType } from 'vue'
import type { FieldSchema } from '../types'
import { defineComponent, h } from 'vue'
import { useFieldState } from '../composables/useFieldState'
import { useFormGeneratorContext } from '../context'

export default defineComponent({
  name: 'DcFormField',

  props: {
    field: {
      type: Object as PropType<FieldSchema>,
      required: true,
    },
  },

  setup(props) {
    const ctx = useFormGeneratorContext()
    const { isVisible, isDisabled } = useFieldState(props.field, ctx)

    return () => {
      if (!isVisible.value)
        return null

      const field = props.field
      const FieldComponent = ctx.fieldComponentMap[field.component]
      const currentValue = ctx.getFieldValue(field.key) ?? field.defaultValue
      const errorMsg = ctx.fieldErrors.value[field.key]
      const disabled = isDisabled.value

      const fieldContent = FieldComponent
        ? h(FieldComponent, {
            'modelValue': currentValue,
            'disabled': disabled,
            'field': field,
            'onUpdate:modelValue': (value: unknown) => {
              ctx.onFieldChange(field.key, value)
            },
          })
        : h('div', { class: 'dc-field-unknown' }, `Unknown field: ${field.component}`)

      const children = [
        h('label', { class: 'dc-form-field__label' }, field.label),
        h('div', { class: 'dc-form-field__control' }, [fieldContent]),
      ]

      if (field.tooltip) {
        children.push(
          h('div', { class: 'dc-form-field__tooltip' }, field.tooltip),
        )
      }

      if (errorMsg) {
        children.push(
          h('div', { class: 'dc-form-field__error' }, errorMsg),
        )
      }

      return h(
        'div',
        {
          class: [
            'dc-form-field',
            {
              'dc-form-field--disabled': disabled,
              'dc-form-field--error': !!errorMsg,
            },
          ],
        },
        children,
      )
    }
  },
})
