import type { FieldSchema, FormGeneratorContext } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { useFieldState } from './useFieldState'

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
  }
}

describe('useFieldState', () => {
  describe('isVisible (ifShow / visible)', () => {
    it('defaults to true when neither ifShow nor visible is set', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input' }
      const ctx = makeCtx()
      const { isVisible } = useFieldState(() => field, ctx)
      expect(isVisible.value).toBe(true)
    })

    it('uses ifShow when set', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input', ifShow: false }
      const ctx = makeCtx()
      const { isVisible } = useFieldState(() => field, ctx)
      expect(isVisible.value).toBe(false)
    })

    it('uses visible as alias for ifShow', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input', visible: () => false }
      const ctx = makeCtx()
      const { isVisible } = useFieldState(() => field, ctx)
      expect(isVisible.value).toBe(false)
    })

    it('ifShow takes precedence over visible', () => {
      const field: FieldSchema = {
        key: 'a',
        label: 'A',
        component: 'input',
        ifShow: false,
        visible: () => true,
      }
      const ctx = makeCtx()
      const { isVisible } = useFieldState(() => field, ctx)
      expect(isVisible.value).toBe(false)
    })

    it('supports ifShow as predicate', () => {
      const field: FieldSchema = {
        key: 'a',
        label: 'A',
        component: 'input',
        ifShow: ctx => ctx.values.type === 'api',
      }
      const ctx = makeCtx({ type: 'static' })
      const { isVisible } = useFieldState(() => field, ctx)
      expect(isVisible.value).toBe(false)

      ctx.values.type = 'api'
      expect(isVisible.value).toBe(true)
    })
  })

  describe('isShown (show)', () => {
    it('defaults to true when show is not set', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input' }
      const ctx = makeCtx()
      const { isShown } = useFieldState(() => field, ctx)
      expect(isShown.value).toBe(true)
    })

    it('returns false when show is false', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input', show: false }
      const ctx = makeCtx()
      const { isShown } = useFieldState(() => field, ctx)
      expect(isShown.value).toBe(false)
    })

    it('supports show as predicate', () => {
      const field: FieldSchema = {
        key: 'a',
        label: 'A',
        component: 'input',
        show: ctx => ctx.values.mode === 'advanced',
      }
      const ctx = makeCtx({ mode: 'basic' })
      const { isShown } = useFieldState(() => field, ctx)
      expect(isShown.value).toBe(false)

      ctx.values.mode = 'advanced'
      expect(isShown.value).toBe(true)
    })
  })

  describe('isDisabled', () => {
    it('defaults to false', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input' }
      const ctx = makeCtx()
      const { isDisabled } = useFieldState(() => field, ctx)
      expect(isDisabled.value).toBe(false)
    })

    it('respects global disabled', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input' }
      const ctx = makeCtx()
      ctx.disabled.value = true
      const { isDisabled } = useFieldState(() => field, ctx)
      expect(isDisabled.value).toBe(true)
    })

    it('respects field-level disabled predicate', () => {
      const field: FieldSchema = {
        key: 'a',
        label: 'A',
        component: 'input',
        disabled: ctx => ctx.values.locked === true,
      }
      const ctx = makeCtx({ locked: true })
      const { isDisabled } = useFieldState(() => field, ctx)
      expect(isDisabled.value).toBe(true)
    })
  })
})
