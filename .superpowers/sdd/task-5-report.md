# Task 5 Report: Extract Property Binding Translation

## What I implemented

- Added a new pure helper module at `packages/designer/src/bindings/field-binding.ts`.
- Moved field binding translation concerns into the helper:
  - `resolveFieldBinding`
  - `readBindingValue`
  - `createBindingCommand`
- Kept schema writes routed through `engine.execute()` by changing `usePropertyBinding` to translate bindings into commands first, then dispatch those commands through the engine.
- Preserved existing binding behavior for:
  - node prop updates
  - node style updates
  - schema root style updates via `root.*`
  - global config updates
- Added path safety guards for blocked path segments such as `__proto__`, `prototype`, and `constructor`.
- Exported the helper API from `packages/designer/src/index.ts` for advanced tests and integrations.

## What I tested and test results

- `pnpm -F @dragcraft/designer test -- field-binding.test.ts`
  - Failed as expected before implementation
- `pnpm -F @dragcraft/designer test -- field-binding.test.ts usePropertyBinding.test.ts`
  - Passed (`6` files, `43` tests)
- `pnpm typecheck`
  - Passed

## TDD Evidence

### RED command/output summary and why expected

- Command: `pnpm -F @dragcraft/designer test -- field-binding.test.ts`
- Result: Failed as expected.
- Key failure:
  - `Error: Cannot find module './field-binding' imported from .../packages/designer/src/bindings/field-binding.test.ts`
- Why expected:
  - The test was added before the helper existed, so the failure confirmed the new suite was exercising missing functionality rather than passing against existing code.

### GREEN command/output summary

- Command: `pnpm -F @dragcraft/designer test -- field-binding.test.ts usePropertyBinding.test.ts`
- Result: Passed (`6` files, `43` tests)
- Command: `pnpm typecheck`
- Result: Passed

## Files changed

- `packages/designer/src/bindings/field-binding.ts`
- `packages/designer/src/bindings/field-binding.test.ts`
- `packages/designer/src/composables/usePropertyBinding.ts`
- `packages/designer/src/index.ts`

## Self-review findings

- The composable no longer performs direct binding-to-command translation inline; that logic now lives in a pure helper.
- UI code still writes schema state only through `engine.execute()`.
- The helper remains within designer package boundaries and does not introduce forbidden package dependencies.
- Existing schema shape assumptions were preserved, including root updates flowing through `nodeId: 'root'`.
- Unsupported or unsafe binding paths now resolve to `null` commands and produce the existing warning path in the composable.

## Issues or concerns

- No functional concerns found during self-review.
- `packages/designer/src/composables/usePropertyBinding.test.ts` did not require source changes because the existing composable tests continued to cover the refactored behavior and passed unchanged.

## Task 5 Unsafe Read Fix Follow-up

### What I fixed

- Changed `readPath()` in `packages/designer/src/bindings/field-binding.ts` to fail closed on unsafe paths instead of returning the original source object.
- Added a focused regression test in `packages/designer/src/bindings/field-binding.test.ts` for `readBindingValue({ scope: 'node', path: 'props.__proto__.polluted' }, ...)`, which now returns `undefined`.

### RED evidence

- Command: `pnpm -F @dragcraft/designer test -- field-binding.test.ts`
- Result: Failed before the fix, as intended.
- Key assertion failure: the unsafe read returned the full node object instead of `undefined`.

### GREEN evidence

- Command: `pnpm -F @dragcraft/designer test -- field-binding.test.ts usePropertyBinding.test.ts`
- Result: Passed (`6` files, `44` tests)
- Command: `pnpm typecheck`
- Result: Passed

### Files changed

- `packages/designer/src/bindings/field-binding.ts`
- `packages/designer/src/bindings/field-binding.test.ts`

### Concerns

- No remaining concerns for this fix. Unsafe binding reads now fail closed and do not leak the source object.
