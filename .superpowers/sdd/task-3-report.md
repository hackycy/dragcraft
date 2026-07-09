# Task 3 Report

## Scope

Replaced the placeholder content for these three concept guides only:

- `docs/guide/schema-and-layout.md`
- `docs/guide/designer-integration.md`
- `docs/guide/import-export-and-i18n.md`

Also added one narrowly scoped regression test in `docs/first-run-guide-content.test.ts` because the original missing-page build failure from the brief no longer reproduced: the guide files already existed as placeholders, so `pnpm docs:build` passed before content work started.

## Sources Used

- `.github/architecture/02-schema-and-core.md`
- `.github/architecture/03-designer-and-renderer.md`
- `.github/architecture/08-layout-system.md`
- `packages/core/src/engine.ts`
- `packages/designer/src/factory.ts`
- `playground/src/App.vue`

## TDD Record

### Red

Added three focused assertions to `docs/first-run-guide-content.test.ts` for:

- schema shape and `LayoutPlan` projection guidance
- `createDesigner()` integration inputs and the `engine.state` / `engine.execute()` boundary
- import/export flow and default message merging for i18n

Ran:

```bash
pnpm exec vitest run docs/first-run-guide-content.test.ts
```

Observed failure:

- 3 tests failed
- each failed because the target guide still contained placeholder copy

### Green

Replaced the placeholder copy in the three guide files with the exact opening promise lines from the brief and the minimal concept explanations anchored to current core, designer, and playground behavior.

Re-ran:

```bash
pnpm exec vitest run docs/first-run-guide-content.test.ts
```

Observed result:

- 7 tests passed

## Verification

Ran:

```bash
pnpm exec vitest run docs/first-run-guide-content.test.ts
pnpm docs:build
```

Results:

- targeted docs content test passed
- VitePress docs build passed

## Notes

- I did not modify any Task 4 or Task 5 pages.
- I did not touch unrelated untracked content under `docs/superpowers/`.
