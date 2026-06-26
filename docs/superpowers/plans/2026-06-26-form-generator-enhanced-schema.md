# Form Generator Enhanced Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dynamic props, explicit field dependencies, value transforms, and show/ifShow visibility to the form-generator's FieldSchema.

**Architecture:** Extend `FieldSchema` with new optional fields. Add a `useFieldDependencies` composable that watches dependency fields and merges handler overrides into a resolved field. Modify `useFieldState` to support `show`/`ifShow` precedence. Integrate value transforms in `FormField`.

**Tech Stack:** Vue 3 (Composition API, computed, watch), Vitest, TypeScript

## Global Constraints

- `structuredClone` is prohibited
- Unicode emoji is prohibited
- All `pnpm build`, `pnpm lint`, `pnpm typecheck` must pass
- Follow existing code style (no semicolons, single quotes, 2-space indent)
- Backward compatible: `visible` remains an alias for `ifShow`; static `props` unchanged

## File Structure

```
packages/form-generator/src/
├── types.ts                           # Modify: add FieldDependencies, extend FieldSchema
├── composables/
│   ├── index.ts                       # Modify: export useFieldDependencies
│   ├── useFieldDependencies.ts        # Create: dependency resolution composable
│   ├── useFieldDependencies.test.ts   # Create: tests
│   ├── useFieldState.ts               # Modify: add isShown, ifShow/visible precedence
│   ├── useFieldState.test.ts          # Create: tests
│   └── useFormValidation.ts           # Modify: accept optional resolvedField
├── components/
│   └── FormField.ts                   # Modify: integrate dependencies, transforms, show/ifShow
└── index.ts                           # Modify: export FieldDependencies
```

---

### Task 1: Extend FieldSchema types

**Files:**
- Modify: `packages/form-generator/src/types.ts`
- Modify: `packages/form-generator/src/index.ts`

**Interfaces:**
- Produces: `FieldDependencies` type, extended `FieldSchema` with `show`, `ifShow`, `props` union, `parseValue`, `valueFormat`

- [ ] **Step 1: Add FieldDependencies interface to types.ts**

Add after the `FieldSchema` interface (before `SectionSchema`):

```ts
/**
 * Declares dependencies on other fields and how to react when they change.
 */
export interface FieldDependencies {
  /** Field keys this field depends on. */
  fields: string[]

  /**
   * Called when any dependency field changes.
   * Returns partial FieldSchema overrides.
   * Cannot override key, component, or dependencies (to prevent cycles).
   */
  handler: (
    form: Record<string, unknown>,
    fieldValue: unknown,
  ) => Partial<Omit<FieldSchema, 'key' | 'component' | 'dependencies'>>
}
```

- [ ] **Step 2: Extend FieldSchema with new fields**

In the `FieldSchema` interface, after the existing `props` field, change `props` type and add new fields:

```ts
  /** Extra props forwarded to the field component. Static or dynamic. */
  props?: Record<string, unknown> | ((ctx: FormContext) => Record<string, unknown>)

  /** Declares which other fields this field depends on, and how to react. */
  dependencies?: FieldDependencies

  /** If false (or predicate returns false), field is hidden via CSS (preserves DOM state). */
  show?: boolean | ((ctx: FormContext) => boolean)

  /** If false (or predicate returns false), field is removed from DOM entirely. */
  ifShow?: boolean | ((ctx: FormContext) => boolean)

  /** Transform value before writing to form model (input -> model). */
  parseValue?: (value: unknown, ctx: FormContext) => unknown

  /** Transform value before passing to component (model -> component). */
  valueFormat?: (value: unknown, ctx: FormContext) => unknown
```

Remove the old `props?: Record<string, unknown>` line and replace with the union type version.

- [ ] **Step 3: Export FieldDependencies from index.ts**

Add to the type exports in `src/index.ts`:

```ts
export type {
  FieldDependencies,
  // ... existing exports
} from './types'
```

- [ ] **Step 4: Run typecheck to verify types compile**

Run: `cd packages/form-generator && pnpm typecheck`
Expected: PASS (new fields are all optional, no breaking changes)

- [ ] **Step 5: Run existing tests to verify backward compatibility**

Run: `cd packages/form-generator && pnpm test`
Expected: All existing tests pass (no behavioral changes yet)

- [ ] **Step 6: Commit**

```bash
git add packages/form-generator/src/types.ts packages/form-generator/src/index.ts
git commit -m "feat(form-generator): add FieldDependencies and extend FieldSchema types"
```

---

### Task 2: Create useFieldDependencies composable

**Files:**
- Create: `packages/form-generator/src/composables/useFieldDependencies.ts`
- Create: `packages/form-generator/src/composables/useFieldDependencies.test.ts`
- Modify: `packages/form-generator/src/composables/index.ts`

**Interfaces:**
- Consumes: `FieldSchema`, `FormGeneratorContext` from `../types`
- Produces: `useFieldDependencies(field, ctx) => { resolvedField: ComputedRef<FieldSchema> }`

- [ ] **Step 1: Write the failing test**

Create `packages/form-generator/src/composables/useFieldDependencies.test.ts`:

```ts
import type { FieldSchema, FormGeneratorContext } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { computed, reactive, ref } from 'vue'
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
        handler: (form) => ({
          props: { placeholder: form.sourceType === 'api' ? 'Enter URL' : '' },
          ifShow: form.sourceType === 'api',
        }),
      },
    }
    const ctx = makeCtx({ sourceType: 'api' })
    const { resolvedField } = useFieldDependencies(field, ctx)

    expect(resolvedField.value.props).toEqual({ placeholder: 'Enter URL' })
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
    }
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
        handler: (form) => ({
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
    useFieldDependencies(field, ctx)

    expect(receivedFieldValue).toBe('John')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/form-generator && pnpm test -- --run composables/useFieldDependencies.test.ts`
Expected: FAIL with "Cannot find module './useFieldDependencies'"

- [ ] **Step 3: Implement useFieldDependencies**

Create `packages/form-generator/src/composables/useFieldDependencies.ts`:

```ts
import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'

export interface FieldDependenciesResult {
  resolvedField: ComputedRef<FieldSchema>
}

/**
 * Resolves dynamic field schema overrides driven by explicit field dependencies.
 * When a field declares `dependencies`, this composable watches those fields
 * and merges the handler's return into a resolved FieldSchema.
 */
export function useFieldDependencies(
  field: FieldSchema,
  ctx: FormGeneratorContext,
): FieldDependenciesResult {
  const resolvedField = computed<FieldSchema>(() => {
    if (!field.dependencies)
      return field

    const form = { ...ctx.values }
    const fieldValue = ctx.getFieldValue(field.key)
    const overrides = field.dependencies.handler(form, fieldValue)

    return {
      ...field,
      ...overrides,
      key: field.key,
      component: field.component,
      dependencies: field.dependencies,
    }
  })

  return { resolvedField }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/form-generator && pnpm test -- --run composables/useFieldDependencies.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Export from composables/index.ts**

Add to `packages/form-generator/src/composables/index.ts`:

```ts
export { useFieldDependencies } from './useFieldDependencies'
export type { FieldDependenciesResult } from './useFieldDependencies'
```

- [ ] **Step 6: Commit**

```bash
git add packages/form-generator/src/composables/useFieldDependencies.ts packages/form-generator/src/composables/useFieldDependencies.test.ts packages/form-generator/src/composables/index.ts
git commit -m "feat(form-generator): add useFieldDependencies composable"
```

---

### Task 3: Extend useFieldState with show/ifShow

**Files:**
- Modify: `packages/form-generator/src/composables/useFieldState.ts`
- Create: `packages/form-generator/src/composables/useFieldState.test.ts`

**Interfaces:**
- Consumes: `FieldSchema`, `FormGeneratorContext`
- Produces: `FieldState` with `isVisible`, `isShown`, `isDisabled`

- [ ] **Step 1: Write the failing test**

Create `packages/form-generator/src/composables/useFieldState.test.ts`:

```ts
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
      const { isVisible } = useFieldState(field, ctx)
      expect(isVisible.value).toBe(true)
    })

    it('uses ifShow when set', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input', ifShow: false }
      const ctx = makeCtx()
      const { isVisible } = useFieldState(field, ctx)
      expect(isVisible.value).toBe(false)
    })

    it('uses visible as alias for ifShow', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input', visible: () => false }
      const ctx = makeCtx()
      const { isVisible } = useFieldState(field, ctx)
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
      const { isVisible } = useFieldState(field, ctx)
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
      const { isVisible } = useFieldState(field, ctx)
      expect(isVisible.value).toBe(false)

      ctx.values.type = 'api'
      expect(isVisible.value).toBe(true)
    })
  })

  describe('isShown (show)', () => {
    it('defaults to true when show is not set', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input' }
      const ctx = makeCtx()
      const { isShown } = useFieldState(field, ctx)
      expect(isShown.value).toBe(true)
    })

    it('returns false when show is false', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input', show: false }
      const ctx = makeCtx()
      const { isShown } = useFieldState(field, ctx)
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
      const { isShown } = useFieldState(field, ctx)
      expect(isShown.value).toBe(false)

      ctx.values.mode = 'advanced'
      expect(isShown.value).toBe(true)
    })
  })

  describe('isDisabled', () => {
    it('defaults to false', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input' }
      const ctx = makeCtx()
      const { isDisabled } = useFieldState(field, ctx)
      expect(isDisabled.value).toBe(false)
    })

    it('respects global disabled', () => {
      const field: FieldSchema = { key: 'a', label: 'A', component: 'input' }
      const ctx = makeCtx()
      ctx.disabled.value = true
      const { isDisabled } = useFieldState(field, ctx)
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
      const { isDisabled } = useFieldState(field, ctx)
      expect(isDisabled.value).toBe(true)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/form-generator && pnpm test -- --run composables/useFieldState.test.ts`
Expected: FAIL (isShown is not defined)

- [ ] **Step 3: Implement show/ifShow in useFieldState**

Modify `packages/form-generator/src/composables/useFieldState.ts`:

```ts
import type { ComputedRef } from 'vue'
import type { FieldSchema, FormGeneratorContext } from '../types'
import { computed } from 'vue'

/**
 * Reactive interaction state computed for a single field.
 */
export interface FieldState {
  /** Whether the field should be rendered in the DOM (ifShow / visible). */
  isVisible: ComputedRef<boolean>
  /** Whether the field should be visually displayed (show — CSS visibility). */
  isShown: ComputedRef<boolean>
  /** Whether the field is disabled. */
  isDisabled: ComputedRef<boolean>
}

/**
 * Computes reactive visibility, display, and disabled state for a given field.
 * Evaluates the field's predicates against the current form values.
 */
export function useFieldState(
  field: FieldSchema,
  ctx: FormGeneratorContext,
): FieldState {
  // ifShow takes precedence over visible (backward compat alias)
  const isVisible = computed(() => {
    if (field.ifShow !== undefined) {
      if (typeof field.ifShow === 'function')
        return field.ifShow({ values: ctx.values })
      return field.ifShow
    }
    if (field.visible !== undefined) {
      if (typeof field.visible === 'function')
        return field.visible({ values: ctx.values })
      return field.visible
    }
    return true
  })

  const isShown = computed(() => {
    if (field.show === undefined)
      return true
    if (typeof field.show === 'function')
      return field.show({ values: ctx.values })
    return field.show
  })

  const isDisabled = computed(() => {
    if (ctx.disabled.value)
      return true
    if (!field.disabled)
      return false
    return field.disabled({ values: ctx.values })
  })

  return { isVisible, isShown, isDisabled }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/form-generator && pnpm test -- --run composables/useFieldState.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Run existing tests to verify no regression**

Run: `cd packages/form-generator && pnpm test -- --run`
Expected: All tests pass (visible predicate tests still work via backward compat)

- [ ] **Step 6: Commit**

```bash
git add packages/form-generator/src/composables/useFieldState.ts packages/form-generator/src/composables/useFieldState.test.ts
git commit -m "feat(form-generator): add show/ifShow support to useFieldState"
```

---

### Task 4: Integrate dependencies, transforms, and show/ifShow in FormField

**Files:**
- Modify: `packages/form-generator/src/components/FormField.ts`

**Interfaces:**
- Consumes: `useFieldDependencies` (Task 2), `useFieldState` with `isShown` (Task 3), `FormContext`
- Produces: Updated FormField render with dynamic props, value transforms, show/ifShow

- [ ] **Step 1: Update FormField imports**

Replace the imports in `packages/form-generator/src/components/FormField.ts`:

```ts
import type { PropType } from 'vue'
import type { FieldSchema, FormContext } from '../types'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'
import { useFieldDependencies } from '../composables/useFieldDependencies'
import { useFieldState } from '../composables/useFieldState'
import { useFormGeneratorContext } from '../context'
```

- [ ] **Step 2: Update setup to use dependencies and new state**

Replace the `setup` function in `FormField.ts`:

```ts
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
```

- [ ] **Step 3: Run typecheck**

Run: `cd packages/form-generator && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Run all tests**

Run: `cd packages/form-generator && pnpm test -- --run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/form-generator/src/components/FormField.ts
git commit -m "feat(form-generator): integrate dependencies, transforms, and show/ifShow in FormField"
```

---

### Task 5: Update validation to accept resolved field

**Files:**
- Modify: `packages/form-generator/src/composables/useFormValidation.ts`

**Interfaces:**
- Produces: `validateField(key, resolvedField?)` signature

- [ ] **Step 1: Update validateField signature**

In `packages/form-generator/src/composables/useFormValidation.ts`, update the `FormValidation` interface and `validateField` implementation:

```ts
export interface FormValidation {
  /** Reactive map of field key -> error message (undefined = no error) */
  fieldErrors: Ref<Record<string, string | undefined>>
  /** Validate a single field by key. Optionally pass a resolved field for dependency-driven rules. */
  validateField: (key: string, resolvedField?: FieldSchema) => string | undefined
  /** Validate all fields. Returns array of errors (empty = all valid). */
  validateAll: () => ValidationError[]
  /** Clear all validation errors */
  clearErrors: () => void
}
```

- [ ] **Step 2: Update validateField implementation to use resolvedField**

In the same file, update the `validateField` function inside `useFormValidation`:

```ts
  const validateField = (key: string, resolvedField?: FieldSchema): string | undefined => {
    const field = resolvedField ?? findFieldSchema(schema, key)
    if (!field)
      return undefined

    const values = getValues()
    const value = values[key]
    const formCtx: FormContext = { values }
    const error = runFieldValidation(field, value, formCtx)

    fieldErrors.value = { ...fieldErrors.value, [key]: error }
    return error
  }
```

- [ ] **Step 3: Run existing validation tests**

Run: `cd packages/form-generator && pnpm test -- --run composables/useFormValidation.test.ts`
Expected: All existing tests pass (backward compatible — resolvedField is optional)

- [ ] **Step 4: Run typecheck**

Run: `cd packages/form-generator && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/form-generator/src/composables/useFormValidation.ts
git commit -m "feat(form-generator): allow validateField to accept resolved field"
```

---

### Task 6: Final integration and build verification

**Files:**
- Modify: `packages/form-generator/src/composables/index.ts` (if not done in Task 2)
- Modify: `packages/form-generator/src/index.ts` (if not done in Task 1)

- [ ] **Step 1: Verify all exports are correct**

Ensure `src/index.ts` exports:
- `FieldDependencies` type
- All existing exports remain

Ensure `src/composables/index.ts` exports:
- `useFieldDependencies`
- `FieldDependenciesResult` type

- [ ] **Step 2: Run full build pipeline**

Run: `cd packages/form-generator && pnpm build && pnpm lint && pnpm typecheck && pnpm test -- --run`
Expected: All pass

- [ ] **Step 3: Commit any final export fixes**

```bash
git add packages/form-generator/src/index.ts packages/form-generator/src/composables/index.ts
git commit -m "chore(form-generator): finalize exports for enhanced schema"
```
