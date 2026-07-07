import type { FieldDependencies, FieldSchema, FormGeneratorContext } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { useFieldDependencies } from './useFieldDependencies'

function makeCtx(values: Record<string, unknown> = {}): FormGeneratorContext {
  const localValues = reactive({ ...values })
  return {
    fieldComponentMap: {},
    onFieldChange: vi.fn(),
    getFieldValue: (key: string) => localValues[key],
    getFormValues: () => ({ ...localValues }),
    values: localValues,
    disabled: ref(false),
    fieldErrors: ref({}),
    validateField: vi.fn(),
  }
}

describe('useFieldDependencies', () => {
  it('returns field as-is when no dependencies', () => {
    const field: FieldSchema = { key: 'name', label: 'Name', component: 'input' }
    const ctx = makeCtx()
    const { resolvedField } = useFieldDependencies(field, ctx)

    expect(resolvedField.value).toBe(field)
  })

  it('calls handler and merges overrides', () => {
    const field: FieldSchema = {
      key: 'endpoint',
      label: 'Endpoint',
      component: 'input',
      dependencies: {
        fields: ['sourceType'],
        handler: form => ({
          componentProps: { placeholder: form.sourceType === 'api' ? 'Enter URL' : '' },
          ifShow: form.sourceType === 'api',
        }),
      },
    }
    const ctx = makeCtx({ sourceType: 'api' })
    const { resolvedField } = useFieldDependencies(field, ctx)

    expect(resolvedField.value.componentProps).toEqual({ placeholder: 'Enter URL' })
    expect(resolvedField.value.ifShow).toBe(true)
    expect(resolvedField.value.key).toBe('endpoint')
    expect(resolvedField.value.component).toBe('input')
  })

  it('locks key, component, and dependencies from override', () => {
    const deps = {
      fields: ['other'],
      handler: () => ({
        key: 'hacked' as any,
        component: 'evil' as any,
      }),
    } as unknown as FieldDependencies
    const field: FieldSchema = {
      key: 'original',
      label: 'Original',
      component: 'input',
      dependencies: deps,
    }
    const ctx = makeCtx({ other: 'val' })
    const { resolvedField } = useFieldDependencies(field, ctx)

    expect(resolvedField.value.key).toBe('original')
    expect(resolvedField.value.component).toBe('input')
    expect(resolvedField.value.dependencies).toBe(deps)
  })

  it('reacts to dependency field changes', async () => {
    const field: FieldSchema = {
      key: 'endpoint',
      label: 'Endpoint',
      component: 'input',
      dependencies: {
        fields: ['sourceType'],
        handler: form => ({
          ifShow: form.sourceType === 'api',
        }),
      },
    }
    const ctx = makeCtx({ sourceType: 'static' })
    const { resolvedField } = useFieldDependencies(field, ctx)

    expect(resolvedField.value.ifShow).toBe(false)

    ctx.values.sourceType = 'api'
    await new Promise(r => setTimeout(r, 0))

    expect(resolvedField.value.ifShow).toBe(true)
  })

  it('passes current field value as second argument to handler', () => {
    let receivedFieldValue: unknown
    const field: FieldSchema = {
      key: 'name',
      label: 'Name',
      component: 'input',
      dependencies: {
        fields: ['other'],
        handler: (_form, fieldValue) => {
          receivedFieldValue = fieldValue
          return {}
        },
      },
    }
    const ctx = makeCtx({ other: 'val', name: 'John' })
    const { resolvedField } = useFieldDependencies(field, ctx)
    // Access .value to trigger the lazy computed evaluation
    void resolvedField.value

    expect(receivedFieldValue).toBe('John')
  })
})
