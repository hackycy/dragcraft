import type { PropType } from 'vue'
import type { FieldSchema, FormContext } from '../types'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'
import { useFieldDependencies } from '../composables/useFieldDependencies'
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
    const { t } = useI18n()

    const { resolvedField } = useFieldDependencies(props.field, ctx)
    const { isVisible, isShown, isDisabled } = useFieldState(resolvedField.value, ctx)

    return () => {
      if (!isVisible.value)
        return null

      const field = resolvedField.value
      const formCtx: FormContext = { values: ctx.values }

      // Resolve dynamic props
      const extraProps = typeof field.props === 'function'
        ? field.props(formCtx)
        : field.props ?? {}

      // Value transform: model -> component
      const rawValue = ctx.getFieldValue(field.key) ?? field.defaultValue
      const currentValue = field.valueFormat?.(rawValue, formCtx) ?? rawValue

      const FieldComponent = ctx.fieldComponentMap[field.component]
      const errorMsg = ctx.fieldErrors.value[field.key]
      const disabled = isDisabled.value

      const fieldContent = FieldComponent
        ? h(FieldComponent, {
            'modelValue': currentValue,
            'disabled': disabled,
            'field': { ...field, props: extraProps },
            'onUpdate:modelValue': (value: unknown) => {
              // Value transform: input -> model
              const transformed = field.parseValue?.(value, formCtx) ?? value
              ctx.onFieldChange(field.key, transformed)
            },
          })
        : h('div', { class: 'dc-field-unknown' }, `Unknown field: ${field.component}`)

      const children = [
        h('label', { class: 'dc-form-field__label' }, field.labelKey ? t(field.labelKey, field.label) : field.label),
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

      const span = field.span ?? 1
      const wrapperClass = [
        'dc-form-field',
        {
          'dc-form-field--disabled': disabled,
          'dc-form-field--error': !!errorMsg,
        },
      ]
      const wrapperStyle: Record<string, string> = {}

      if (span > 1) {
        wrapperClass.push(`dc-form-field--span-${span}`)
        wrapperStyle['--dc-span'] = String(span)
      }

      // show: false -> display: none (CSS hide, preserves DOM)
      if (!isShown.value) {
        wrapperStyle.display = 'none'
      }

      return h(
        'div',
        { class: wrapperClass, style: wrapperStyle },
        children,
      )
    }
  },
})
