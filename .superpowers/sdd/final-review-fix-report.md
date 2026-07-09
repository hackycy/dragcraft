# Final Review Fix Report

Date: 2026-07-09
Branch: `architecture-fixes`
Base HEAD before fixes: `64d0119`

## Summary

Addressed the two Important and two Minor whole-branch review findings:

1. `MOVE_NODE` same-position operations now bail out before mutation, so they do not create history or emit schema change events.
2. `@dragcraft/designer` now types public widget metadata input with renderer-aware metadata and re-exports renderer metadata/action config types.
3. Core architecture docs no longer document renderer-only widget UI metadata inside the core chapter.
4. Removed the tracked local SDD report file from the branch.

## Fixes by Finding

### Important 1: Same-position `MOVE_NODE` still recorded history/events

What changed:

- Added an early `return false` in `packages/core/src/commands/move-node.ts` when `targetScopeIndex === sourceScopeIndex`.
- Added an engine-level regression test in `packages/core/src/engine.test.ts` asserting same-index `MOVE_NODE` leaves schema order unchanged, does not push history, and does not emit `schema:changed`.

Root cause:

- `moveNodeHandler()` normalized the requested target scope index but always proceeded to splice/reinsert, so `CommandBus` treated a no-op move as a successful mutation.

### Important 2: Designer public API under-typed renderer metadata

What changed:

- Updated `packages/designer/src/types.ts` so `DesignerOptions.widgetMetas` uses `RendererWidgetMeta[]`.
- Updated exported/public metadata callback surfaces to use `RendererWidgetMeta` where they carry designer material metadata:
  - `DesignerExtensions.renderWidgetItem`
  - `DesignerContext.handleMaterialDragStart`
- Updated local designer component/composable type surfaces to match:
  - `packages/designer/src/components/DcMaterialGroup.ts`
  - `packages/designer/src/components/DcMaterialItem.ts`
  - `packages/designer/src/composables/useDragDrop.ts`
- Re-exported renderer metadata/action types from `packages/designer/src/index.ts`:
  - `RendererWidgetMeta`
  - `RendererWidgetActionExtra`
  - `RendererWidgetActionConfig` (alias of renderer `WidgetActionConfig`)
- Added `packages/designer/src/factory.test.ts` covering `createDesigner({ widgetMetas: [...] })` with renderer-only fields (`wrapper`, `actions.extra`) and asserting they survive registration.

Notes:

- Existing core compatibility exports such as `WidgetMeta` and core `WidgetActionConfig` remain exported.

### Minor 1: Core docs still contained renderer-only widget UI metadata

What changed:

- Removed the `wrapper` row from the core widget behavior table in `.github/architecture/02-schema-and-core.md`.
- Narrowed the action config section from renderer-style `WidgetActionConfig` to core-only `CoreWidgetActionConfig` (`only` / `exclude`).
- Added a short pointer to renderer docs for renderer-only `wrapper` and `extra` metadata.

Remaining grep hits:

- `wrapper` and `extra` still appear in brief explanatory note/link lines that explicitly say those fields belong to renderer, not core.
- No remaining renderer-only details are documented in the core protocol/action config definitions themselves.

### Minor 2: Hidden SDD report was tracked

What changed:

- Removed `.superpowers/sdd/task-5-report.md` from the branch.

## RED Evidence

### Core regression test before fix

Command:

```bash
pnpm -F @dragcraft/core test -- engine.test.ts move-node.test.ts
```

Observed failure:

```text
FAIL  src/engine.test.ts > createEngine > same-index MOVE_NODE does not push history or emit schema changed
AssertionError: expected true to be false
```

This showed same-index `MOVE_NODE` still pushed history before the handler fix.

### Designer public API type failure before export fix

Command:

```bash
pnpm -F @dragcraft/designer typecheck
```

Observed failure:

```text
src/factory.test.ts(2,15): error TS2459: Module '".."' declares 'RendererWidgetActionExtra' locally, but it is not exported.
src/factory.test.ts(2,42): error TS2459: Module '".."' declares 'RendererWidgetMeta' locally, but it is not exported.
```

This showed the designer barrel was not exposing the renderer metadata types needed by the new API assertion.

## GREEN Evidence

### Behavior and focused test checks

Command:

```bash
pnpm -F @dragcraft/core test -- engine.test.ts move-node.test.ts
```

Result:

```text
Test Files  16 passed (16)
Tests  179 passed (179)
```

Command:

```bash
pnpm -F @dragcraft/designer test -- factory.test.ts
```

Result:

```text
Test Files  7 passed (7)
Tests  45 passed (45)
```

### Type checks

Commands:

```bash
pnpm -F @dragcraft/designer typecheck
pnpm typecheck
```

Result:

- Both commands exited with code `0`.

### Docs check

Command:

```bash
rg "wrapper|Component|extra" .github/architecture/02-schema-and-core.md
```

Result:

```text
Vue 组件引用、`wrapper` 和 renderer 侧 action extra 配置不属于 core 协议；这些 UI 元数据由 renderer 的 `RendererWidgetMeta` 扩展承载。
Renderer 侧 `wrapper` 与 action `extra` 扩展见 [`.github/architecture/03-designer-and-renderer.md`](/Users/qigong-it-1/Workspace/dragcraft-worktrees/architecture-fixes/.github/architecture/03-designer-and-renderer.md)。
```

These remaining matches are intentional cross-references, not core protocol definitions.

### Tracked file removal check

Command:

```bash
git ls-files .superpowers/sdd/task-5-report.md
```

Result:

- No output after the fix commit, confirming the tracked file is gone from the branch.

## Files Changed

- `.github/architecture/02-schema-and-core.md`
- `.superpowers/sdd/task-5-report.md` (deleted)
- `packages/core/src/commands/move-node.ts`
- `packages/core/src/engine.test.ts`
- `packages/designer/src/components/DcMaterialGroup.ts`
- `packages/designer/src/components/DcMaterialItem.ts`
- `packages/designer/src/composables/useDragDrop.ts`
- `packages/designer/src/factory.test.ts`
- `packages/designer/src/index.ts`
- `packages/designer/src/types.ts`

## Concerns

- Designer tests inside the package resolve `..` through package metadata, which can point at stale `dist` declarations during source-only work. The new API assertion uses the local source barrel (`./index`) so `tsc` verifies the current source tree without requiring a build step.
