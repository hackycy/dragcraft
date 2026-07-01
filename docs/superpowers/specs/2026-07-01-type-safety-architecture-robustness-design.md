# Type Safety & Architecture Robustness Improvements

**Date:** 2026-07-01
**Scope:** Structural improvements to eliminate type safety gaps and add runtime robustness
**Packages affected:** `utils`, `core`, `designer`, `builtin-fields`

---

## Problem Statement

The codebase has several type safety and architecture robustness issues that could lead to runtime bugs:

1. `EventEmitter` uses the untyped `Function` type with a lint suppression
2. Three production `as unknown as X` double-cast assertions bypass type safety
3. The command bus has no error recovery -- a throwing handler leaves the schema in a partially mutated state
4. Widget registration accepts any object without runtime validation
5. `patchNode()` bypasses the command system but its name doesn't signal this intent

## Changes

### 1. EventEmitter Type Safety

**Files:** `packages/utils/src/event-emitter.ts`, `packages/core/src/event-hub.ts`

Replace the untyped `Function` type with a proper callable signature:

- Remove `/* eslint-disable ts/no-unsafe-function-type */` from `event-emitter.ts`
- Replace all 4 occurrences of `Function` with `(...args: unknown[]) => void`
- Change `EventHub`'s `EventListener` type from `(...args: any[]) => void` to `(...args: unknown[]) => void`

**Rationale:** The `Function` type is equivalent to `(...args: any[]) => any` -- it provides zero type checking on the callable signature. Using `(...args: unknown[]) => void` is the minimal typed replacement. The `EventHub` wrapper mediates all access to `EventEmitter`, so end-to-end type safety is achieved at the call sites.

**Compatibility:** `vi.fn()` (returns `(...args: any[]) => any`) is assignable to the new type because `any` is assignable to `unknown`. Existing test code compiles without changes.

### 2. Double-Cast Assertions

Three production `as unknown as X` casts are replaced with proper type alignment.

#### 2a. `factory.ts` -- globalConfigSchema cast

**Root cause:** `registerGlobalConfigSchema()` accepts `Record<string, unknown>` but receives a `FormSchemaShape`. These are distinct interfaces.

**Fix:**
- Add `registerGlobalConfigFormSchema(schema: FormSchemaShape): void` to `RegistryInstance` in `packages/core/src/types.ts`
- Implement in `packages/core/src/registry.ts` (same storage logic)
- In `packages/designer/src/factory.ts`, call `registerGlobalConfigFormSchema(globalConfigSchema)` with zero casts

#### 2b. `usePropertyBinding.ts` -- formSchema cast

**Root cause:** `WidgetMeta.formSchema` is `FormSchemaShape` (core avoids depending on form-generator), but the consumer needs `FormSchema`. These types are structurally compatible.

**Fix:** Change `meta.formSchema as unknown as FormSchema` to `meta.formSchema as FormSchema`. Single cast.

#### 2c. `ArrayField.ts` -- field props cast

**Root cause:** `FieldSchema.props` is `Record<string, unknown> | ((ctx) => Record<string, unknown>)`. After resolution it's a plain object that needs to be `ArrayFieldConfig`.

**Fix:** Change `(props.field.props || {}) as unknown as ArrayFieldConfig` to `(props.field.props || {}) as ArrayFieldConfig`. Single cast. This is a legitimate internal narrowing.

### 3. Command Bus Error Recovery

**File:** `packages/core/src/command-bus.ts`

Wrap the handler execution in try/catch:

```ts
const beforeSnapshot = cloneDeep(toRaw(store.schema.value))
history.pushSnapshot(command.type, beforeSnapshot)

try {
  handler(ctx, command.payload)
} catch (error) {
  store.setSchema(beforeSnapshot)
  console.error(`[dragcraft/core] Command "${command.type}" failed, rolling back:`, error)
  return
}

store.triggerUpdate()
// event emission unchanged
```

**Rationale:** Without try/catch, a throwing handler leaves the schema in a partially mutated state. The snapshot was already pushed before the handler ran, so on failure we restore it and return early. The wasted undo entry is acceptable -- the alternative (pushing snapshot after success) risks losing the pre-command state if snapshot logic itself fails.

**Test:** Add a test case that registers a throwing handler and verifies the schema is restored to its pre-command state.

### 4. Widget Registration Validation

**File:** `packages/core/src/registry.ts`

Add minimal validation at the top of `registerWidget()`:

- `meta.type` must be a non-empty string (required for the Map key)
- `meta.title` must be a non-empty string (required for material panel display)

If validation fails, log a warning and return early. Full shape validation is TypeScript's job at build time.

**Tests:** Add test cases for missing type and missing title.

### 5. Rename `patchNode` to `applyTransientPatch`

**Files:** `packages/core/src/types.ts`, `packages/core/src/schema-store.ts`, `packages/core/src/schema-store.test.ts`, `packages/core/README.md`

Rename the method to make the "no history, no events" intent explicit at every call site. No external consumers exist -- all usages are within `@dragcraft/core`.

---

## Implementation Order

1. EventEmitter type safety (leaf change)
2. Rename `patchNode` to `applyTransientPatch` (internal to core)
3. Widget registration validation (internal to core)
4. Registry type additions (enables factory.ts fix)
5. Double-cast removal (depends on step 4)
6. Command bus error recovery (independent)

Each step is independently verifiable via `pnpm typecheck && pnpm build && pnpm test`.

## Verification

After all changes:
- `pnpm typecheck` passes
- `pnpm build` passes
- `pnpm lint` passes (eslint-disable removal verified)
- `pnpm test` passes (new tests for error recovery and validation)
