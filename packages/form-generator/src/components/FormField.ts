import type { PropType } from 'vue'
import type { FieldSchema } from '../types'
import { useI18n } from '@dragcraft/utils'
import { computed, defineComponent, h } from 'vue'
import { useFieldDependencies } from '../composables/useFieldDependencies'
import { useFieldState } from '../composables/useFieldState'
import { useFormGeneratorContext } from '../context'
import { createFormContext, resolveFieldComponentProps } from '../utils'

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

    const { resolvedField } = useFieldDependencies(() => props.field, ctx)
    const { isVisible, isShown, isDisabled } = useFieldState(() => resolvedField.value, ctx)

    const value = computed(() => {
      const field = resolvedField.value
      const currentValue = ctx.getFieldValue(field.key)
      const rawValue = currentValue === undefined ? field.defaultValue : currentValue
      return field.valueFormat?.(rawValue, createFormContext(ctx.values)) ?? rawValue
    })
    const componentProps = computed(() =>
      resolveFieldComponentProps(resolvedField.value, createFormContext(ctx.values), t),
    )
    const validate = (): void => {
      const field = resolvedField.value
      ctx.validateField(field.key, field)
    }
    const setValue = (value: unknown): void => {
      const field = resolvedField.value
      const transformed = field.parseValue?.(value, createFormContext(ctx.values)) ?? value
      ctx.onFieldChange(field.key, transformed)
      validate()
    }
    const fieldRender = typeof props.field.component === 'function'
      ? props.field.component({
          field: resolvedField,
          values: ctx.values,
          value,
          disabled: isDisabled,
          componentProps,
          t,
          setValue,
          validate,
        })
      : undefined

    const renderRegisteredField = (field: FieldSchema, disabled: boolean) => {
      const definition = typeof field.component === 'string'
        ? ctx.fieldComponentMap[field.component]
        : undefined
      const transformCtx = { field, values: ctx.values }
      const currentValue = definition?.formatValue?.(value.value, transformCtx) ?? value.value
      const FieldComponent = definition?.component
      const fieldContent = definition && FieldComponent
        ? h(FieldComponent, {
            ...definition.defaultProps,
            ...componentProps.value,
            disabled,
            [definition.modelPropName ?? 'modelValue']: currentValue,
            [definition.updateEventName ?? 'onUpdate:modelValue']: (value: unknown) => {
              const normalized = definition.normalizeValue?.(value, transformCtx) ?? value
              setValue(normalized)
            },
          })
        : h('div', { class: 'dc-field-unknown' }, `Unknown field: ${String(field.component)}`)

      return [
        h('label', { class: 'dc-form-field__label' }, field.labelKey ? t(field.labelKey, field.label) : field.label),
        h('div', { class: 'dc-form-field__control' }, [fieldContent]),
      ]
    }

    return () => {
      if (!isVisible.value)
        return null

      const field = resolvedField.value
      const errorMsg = ctx.fieldErrors.value[field.key]
      const disabled = isDisabled.value

      const children = fieldRender
        ? [fieldRender()]
        : renderRegisteredField(field, disabled)

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
