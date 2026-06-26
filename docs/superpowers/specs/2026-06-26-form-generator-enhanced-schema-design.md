# Form Generator Enhanced Schema Design

**Date:** 2026-06-26
**Package:** `@dragcraft/form-generator`
**Goal:** Enhance the form-generator's `FieldSchema` to support dynamic component props, explicit field dependencies, value transforms, and show/ifShow visibility — primarily to power the designer's property panel.

## Motivation

The current `FieldSchema` supports static `props`, reactive `visible`/`disabled` predicates, and basic validation. This works for simple forms, but the designer's property panel needs:

1. **Dynamic component props** — select options that change based on another field's value
2. **Explicit field dependencies** — clear declaration of which fields affect which, with handler-driven schema overrides
3. **Value transforms** — converting between component output and model storage (e.g., number ↔ string)
4. **Show vs IfShow** — CSS hide (preserves DOM state) vs DOM remove

## Design

### 1. FieldSchema Extensions

```ts
interface FieldSchema {
  // ... existing fields unchanged ...

  /** Extra props forwarded to the field component. Static or dynamic. */
  props?: Record<string, unknown> | ((ctx: FormContext) => Record<string, unknown>)

  /** Declares which other fields this field depends on, and how to react. */
  dependencies?: FieldDependencies

  /** If false (or predicate returns false), field is hidden via CSS (preserves DOM state). */
  show?: boolean | ((ctx: FormContext) => boolean)

  /** If false (or predicate returns false), field is removed from DOM entirely. */
  ifShow?: boolean | ((ctx: FormContext) => boolean)

  /** Transform value before writing to form model (input → model). */
  parseValue?: (value: unknown, ctx: FormContext) => unknown

  /** Transform value before passing to component (model → component). */
  valueFormat?: (value: unknown, ctx: FormContext) => unknown
}
```

#### FieldDependencies

```ts
interface FieldDependencies {
  /** Field keys this field depends on. */
  fields: string[]

  /**
   * Called when any dependency field changes.
   * Returns partial FieldSchema overrides — can change props, rules, show, ifShow, disabled, label, tooltip, etc.
   * Cannot override key, component, or dependencies (to prevent cycles).
   */
  handler: (
    form: Record<string, unknown>,
    fieldValue: unknown,
  ) => Partial<Omit<FieldSchema, 'key' | 'component' | 'dependencies'>>
}
```

#### Show vs IfShow Semantics

- `ifShow: false` → field removed from DOM (like Vue's `v-if`)
- `show: false` → field hidden via `display: none` (like Vue's `v-show`)
- `visible` remains as a backward-compatible alias for `ifShow`
- Precedence: `ifShow` > `visible` > default (true)

#### Props as Function

When `props` is a function, it receives `FormContext` and returns the props object. This is evaluated independently from `dependencies` — both can coexist. When used with `dependencies`, the handler's `props` override takes precedence over the function `props`.

### 2. New Composable: useFieldDependencies

**File:** `src/composables/useFieldDependencies.ts`

Watches dependency fields and resolves dynamic schema overrides.

```ts
function useFieldDependencies(
  field: FieldSchema,
  ctx: FormGeneratorContext,
): { resolvedField: ComputedRef<FieldSchema> }
```

**Resolution logic:**
1. If `field.dependencies` is undefined, return the field as-is.
2. Otherwise, create a `computed` that:
   - Reads `ctx.values` (reactive) to establish dependency tracking
   - Reads the current field's own value via `ctx.getFieldValue(field.key)`
   - Calls `field.dependencies.handler(form, fieldValue)`
   - Merges the result onto the base field, locking `key`, `component`, and `dependencies`
3. Returns the merged `FieldSchema`.

**Resolution order:**
```
Base field schema → dependency handler overrides → render
```

### 3. Modified Composable: useFieldState

**File:** `src/composables/useFieldState.ts`

Add `isShown` computed alongside existing `isVisible` and `isDisabled`:

```ts
interface FieldState {
  isVisible: ComputedRef<boolean>  // ifShow / visible — DOM removal
  isShown: ComputedRef<boolean>    // show — CSS visibility
  isDisabled: ComputedRef<boolean>
}
```

**Logic:**
- `isVisible`: checks `ifShow` first, then `visible` (backward compat). Both are DOM-remove semantics.
- `isShown`: checks `show`. CSS-hide semantics.
- `isDisabled`: unchanged (checks `disabled` predicate + global disabled).

### 4. Modified Component: FormField

**File:** `src/components/FormField.ts`

Changes:
1. Call `useFieldDependencies` to get `resolvedField`
2. Pass `resolvedField` to `useFieldState` (instead of raw `field`)
3. Resolve dynamic `props`: if `resolvedField.props` is a function, call it with `FormContext`
4. Apply `valueFormat` when passing `modelValue` to the component
5. Apply `parseValue` in `onUpdate:modelValue` before calling `ctx.onFieldChange`
6. Apply `isShown` as CSS `display: none` wrapper when `show` is false
7. Keep existing `isVisible` (ifShow) logic for DOM removal

**Render flow:**
```
resolvedField = useFieldDependencies(field, ctx)
{ isVisible, isShown, isDisabled } = useFieldState(resolvedField, ctx)

if (!isVisible.value) return null  // DOM remove

rawValue = ctx.getFieldValue(resolvedField.key) ?? resolvedField.defaultValue
currentValue = resolvedField.valueFormat?.(rawValue, formCtx) ?? rawValue

componentProps = typeof resolvedField.props === 'function'
  ? resolvedField.props(formCtx)
  : resolvedField.props

// Render with isShown CSS visibility
h('div', { style: { display: isShown.value ? undefined : 'none' } }, [...])
```

### 5. Validation Integration

**File:** `src/composables/useFormValidation.ts`

The validation system receives the base schema. When a field has dependencies that override `rules`, the resolved field's rules should be used.

**Approach:** `FormField` passes the resolved field's rules to `validateField` by key, or `validateField` accepts an optional field override. The simplest approach: `validateField` already looks up the field by key from the schema — instead, allow passing a resolved field directly:

```ts
validateField: (key: string, resolvedField?: FieldSchema) => string | undefined
```

When `resolvedField` is provided, use its rules instead of looking up from the base schema.

### 6. Backward Compatibility

- `visible` remains as an alias for `ifShow`. No breaking changes to existing schemas.
- `props` as `Record<string, unknown>` (static) continues to work exactly as before.
- Fields without `dependencies` behave identically to current implementation.
- All existing tests should pass without modification.

## Files to Modify

| File | Action | Changes |
|---|---|---|
| `src/types.ts` | Modify | Add `FieldDependencies` interface, extend `FieldSchema` with `show`, `ifShow`, `props` (union type), `parseValue`, `valueFormat` |
| `src/composables/useFieldState.ts` | Modify | Add `isShown` computed, handle `ifShow`/`visible` precedence |
| `src/composables/useFieldDependencies.ts` | **Create** | New composable for dependency resolution |
| `src/composables/index.ts` | Modify | Export `useFieldDependencies` |
| `src/components/FormField.ts` | Modify | Integrate dependencies, value transforms, show/ifShow |
| `src/composables/useFormValidation.ts` | Modify | Accept optional resolved field for rule lookup |
| `src/index.ts` | Modify | Export new types (`FieldDependencies`) |

## New Tests

1. **useFieldDependencies** — handler called on dependency change, partial override merges correctly, cycle prevention (key/component/deps locked)
2. **useFieldState** — `show` vs `ifShow` vs `visible` precedence, all combinations
3. **Value transforms** — `parseValue` on input, `valueFormat` on render, both together
4. **Props as function** — resolved correctly, receives FormContext
5. **Integration** — full field with dependencies + transforms + show/ifShow working together

## Example Usage

```ts
const schema: FormSchema = {
  sections: [
    {
      title: 'Data Source',
      fields: [
        {
          key: 'sourceType',
          label: 'Source Type',
          component: 'select',
          props: {
            options: [
              { label: 'Static', value: 'static' },
              { label: 'API', value: 'api' },
              { label: 'Database', value: 'db' },
            ],
          },
        },
        {
          key: 'endpoint',
          label: 'API Endpoint',
          component: 'input',
          dependencies: {
            fields: ['sourceType'],
            handler: (form) => ({
              ifShow: form.sourceType === 'api',
              rules: form.sourceType === 'api'
                ? [{ required: true, message: 'Endpoint is required for API source' }]
                : [],
              props: {
                placeholder: 'https://api.example.com/data',
              },
            }),
          },
        },
        {
          key: 'tableName',
          label: 'Table Name',
          component: 'input',
          dependencies: {
            fields: ['sourceType'],
            handler: (form) => ({
              show: form.sourceType === 'db',
              props: {
                placeholder: 'Enter table name',
              },
            }),
          },
        },
        {
          key: 'refreshInterval',
          label: 'Refresh Interval (seconds)',
          component: 'number',
          parseValue: (value) => Number(value) || 0,
          valueFormat: (value) => String(value ?? ''),
          dependencies: {
            fields: ['sourceType'],
            handler: (form) => ({
              ifShow: form.sourceType !== 'static',
              props: {
                min: form.sourceType === 'api' ? 10 : 1,
                max: 3600,
              },
            }),
          },
        },
      ],
    },
  ],
}
```
