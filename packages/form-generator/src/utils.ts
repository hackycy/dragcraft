import type { I18nInstance } from '@dragcraft/i18n'
import type { FieldSchema, FormContext } from './types'

export type FormValues = Record<string, unknown>

export function createFormContext(values: FormValues): FormContext {
  return { values }
}

export function copyFormValues(values: FormValues): FormValues {
  return { ...values }
}

export function resolveFieldModelValue(field: FieldSchema, values: FormValues): unknown {
  const value = values[field.key]
  return value === undefined ? field.defaultValue : value
}

export function syncReactiveRecord(target: FormValues, source: FormValues): void {
  for (const key of Object.keys(target)) {
    if (!(key in source))
      delete target[key]
  }

  for (const [key, value] of Object.entries(source)) {
    target[key] = value
  }
}

export function evaluateBoolean(
  value: boolean | ((ctx: FormContext) => boolean) | undefined,
  ctx: FormContext,
  defaultValue: boolean,
): boolean {
  if (value === undefined)
    return defaultValue
  return typeof value === 'function' ? value(ctx) : value
}

export function resolveFieldDependencies(
  field: FieldSchema,
  values: FormValues,
  fieldValue: unknown,
): FieldSchema {
  if (!field.dependencies)
    return field

  const overrides = field.dependencies.handler(copyFormValues(values), fieldValue)

  return {
    ...field,
    ...overrides,
    key: field.key,
    component: field.component,
    dependencies: field.dependencies,
  }
}

export function resolveFieldComponentProps(
  field: FieldSchema,
  formCtx: FormContext,
  t: I18nInstance['t'],
): Record<string, unknown> {
  const props = typeof field.componentProps === 'function'
    ? field.componentProps(formCtx)
    : field.componentProps ?? {}
  const resolvedProps = { ...props } as Record<string, unknown>

  if (field.placeholderKey) {
    resolvedProps.placeholder = t(field.placeholderKey, String(resolvedProps.placeholder ?? ''))
  }

  if (field.optionKeyPrefix && Array.isArray(resolvedProps.options)) {
    resolvedProps.options = resolvedProps.options.map((option) => {
      if (!option || typeof option !== 'object' || !('value' in option))
        return option

      const value = (option as { value: unknown }).value
      const label = 'label' in option ? String((option as { label?: unknown }).label ?? '') : ''
      return {
        ...option,
        label: t(`${field.optionKeyPrefix}.${String(value)}`, label),
      }
    })
  }

  return resolvedProps
}
