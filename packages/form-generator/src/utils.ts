import type { FieldSchema, FormContext } from './types'

export type FormValues = Record<string, unknown>

export function createFormContext(values: FormValues): FormContext {
  return { values }
}

export function copyFormValues(values: FormValues): FormValues {
  return { ...values }
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
