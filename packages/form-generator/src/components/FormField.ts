import type { PropType, VNodeChild } from 'vue'
import type { FieldPresentationContext, FieldRenderContext, FieldSchema } from '../types'
import { useI18n } from '@dragcraft/i18n'
import { computed, defineComponent, h, shallowRef, watch } from 'vue'
import { useFieldDependencies } from '../composables/useFieldDependencies'
import { useFieldState } from '../composables/useFieldState'
import { useFormGeneratorContext } from '../context'
import { createFormContext, resolveFieldComponentProps, resolveFieldModelValue } from '../utils'

function isEmptyPresentationContent(content: VNodeChild | undefined): boolean {
  return content === null
    || content === undefined
    || content === false
    || content === ''
    || (Array.isArray(content) && content.length === 0)
}

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
      const modelValue = resolveFieldModelValue(field, ctx.values)
      return field.valueFormat?.(modelValue, createFormContext(ctx.values)) ?? modelValue
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
    const presentationContext: FieldPresentationContext = {
      field: resolvedField,
      values: ctx.values,
      value,
      disabled: isDisabled,
      t,
    }
    const fieldRenderContext: FieldRenderContext = {
      ...presentationContext,
      field: resolvedField,
      values: ctx.values,
      componentProps,
      setValue,
      validate,
    }
    const fieldRender = shallowRef<(() => VNodeChild) | undefined>()

    watch(
      () => props.field.component,
      (component) => {
        fieldRender.value = typeof component === 'function'
          ? component(fieldRenderContext)
          : undefined
      },
      { immediate: true },
    )

    const resolveLabel = (field: FieldSchema): VNodeChild | undefined => {
      if (typeof field.label === 'function')
        return field.label(presentationContext)

      return field.labelKey ? t(field.labelKey, field.label ?? '') : field.label
    }

    const resolveHelpMessage = (field: FieldSchema): string | undefined => {
      const message = typeof field.helpMessage === 'function'
        ? field.helpMessage(presentationContext)
        : field.helpMessage
      return message || undefined
    }

    const renderRegisteredFieldContent = (field: FieldSchema, disabled: boolean) => {
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
        : h('div', { 'class': 'dc-field-unknown', 'data-dc-part': 'unknown' }, `Unknown field: ${String(field.component)}`)

      return fieldContent
    }

    return () => {
      if (!isVisible.value)
        return null

      const field = resolvedField.value
      const errorMsg = ctx.fieldErrors.value[field.key]
      const disabled = isDisabled.value
      const label = resolveLabel(field)
      const helpMessage = resolveHelpMessage(field)
      const fieldContent = fieldRender.value
        ? fieldRender.value()
        : renderRegisteredFieldContent(field, disabled)
      const children: VNodeChild[] = []

      if (!isEmptyPresentationContent(label)) {
        children.push(
          h('label', { 'class': 'dc-form-field__label', 'data-dc-part': 'label' }, [label]),
        )
      }

      children.push(
        h('div', { 'class': 'dc-form-field__control', 'data-dc-part': 'control' }, [fieldContent]),
      )

      if (helpMessage) {
        children.push(
          h('div', { 'class': 'dc-form-field__help-message', 'data-dc-part': 'help-message' }, helpMessage),
        )
      }

      if (errorMsg) {
        children.push(
          h('div', { 'class': 'dc-form-field__error', 'data-dc-part': 'error' }, errorMsg),
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
        wrapperStyle['--dc-internal-form-field-span'] = String(span)
      }

      // show: false -> display: none (CSS hide, preserves DOM)
      if (!isShown.value) {
        wrapperStyle.display = 'none'
      }

      return h(
        'div',
        {
          'class': wrapperClass,
          'style': wrapperStyle,
          'data-dc-component': 'form-field',
          'data-dc-state': [disabled ? 'disabled' : null, errorMsg ? 'error' : null].filter(Boolean).join(' ') || undefined,
        },
        children,
      )
    }
  },
})
