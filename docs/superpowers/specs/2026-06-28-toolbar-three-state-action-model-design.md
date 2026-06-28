# Toolbar Three-State Action Model

**Date:** 2026-06-28
**Status:** Draft
**Scope:** Per-node floating toolbar action visibility/disabled behavior

## Problem

When a widget is selected in the device frame, the per-node floating toolbar shows actions (drag, move-up, move-down, delete). Currently, when an action is unavailable (e.g., move-up when the widget is at index 0), the action **disappears entirely** instead of showing a disabled state. This causes the toolbar to change size/layout unexpectedly and makes features feel like they vanish without explanation.

The root cause: the `visible` predicate is doing double duty — it's both a "does this action conceptually apply?" check and a "is this action currently usable?" check. Actions filtered by `visible` are removed from the DOM entirely.

## Solution: Three-State Model

Introduce a clear three-state semantic for toolbar actions:

| State | Rendered? | Interactive? | Meaning |
|---|---|---|---|
| **hidden** (`visible: false`) | No | — | Action doesn't conceptually apply to this widget type |
| **disabled** (`available: false` or `disabled: true`) | Yes, grayed out | No | Action applies but is currently unavailable |
| **enabled** (default) | Yes | Yes | Action is available |

Key distinction: `visible` answers "does this action belong on this widget?" while `available` answers "can this action be used right now?"

## API Changes

### NodeActionDefinition

Add one field to the action definition interface:

```ts
interface NodeActionDefinition {
  // existing
  visible?: (ctx: NodeActionContext) => boolean   // default: true
  disabled?: (ctx: NodeActionContext) => boolean   // default: false

  // new
  available?: (ctx: NodeActionContext) => boolean  // default: true
}
```

### Resolution Logic

Update the `resolve()` method in `NodeActionRegistry`:

```ts
const visible = def.visible ? def.visible(ctx) : true
if (!visible) return null  // hidden — not rendered

const available = def.available ? def.available(ctx) : true
const disabled = !available || (def.disabled ? def.disabled(ctx) : false)
```

### WidgetActionConfig

Add `available` to the `extra` action type in `WidgetActionConfig` so per-widget custom actions can also use the three-state model:

```ts
extra?: Array<{
  // existing fields...
  visible?: (ctx: ...) => boolean
  disabled?: (ctx: ...) => boolean
  // new
  available?: (ctx: ...) => boolean
}>
```

## Built-in Action Changes

| Action | `visible` | `available` | `disabled` |
|---|---|---|---|
| Drag | always `true` | `draggable && sortable` | — |
| Move Up | always `true` | `draggable && sortable` | `index === 0` or locked |
| Move Down | always `true` | `draggable && sortable` | `index >= siblingCount - 1` or locked |
| Delete | always `true` | `deletable` | locked |

Previous behavior: `visible` checked `draggable && sortable` (or `deletable`), so actions were hidden when the capability was absent. Now they render as disabled.

## Component Changes

### DefaultNodeToolbar

The drag-handle renders as a `<div>` (not a `<button>`), so it doesn't support the native `disabled` attribute. When `action.disabled` is true:

- Add CSS class `dc-node__toolbar-btn--disabled`
- Prevent `onDragstart` from firing

Button-type actions already handle `disabled` natively via the `<button>` element.

### CSS

Add disabled state class for drag-handle elements (in `canvas.css`):

```css
.dc-node__toolbar-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
```

This mirrors the existing `:disabled` pseudo-class styles (lines 168-172 of `canvas.css`) but applies to `<div>` elements that can't use the native disabled attribute.

## Backward Compatibility

- `available` defaults to `true` — existing actions without it are unaffected
- `WidgetMeta.actions.only`, `.exclude`, `.extra` continue to work
- Third-party actions that only define `visible` + `disabled` behave identically
- The global canvas toolbar (undo/redo in `createDeviceToolbarRenderer`) is unaffected — it already renders disabled buttons correctly

## Files to Modify

1. `packages/renderer/src/action-registry.ts` — Add `available` to `NodeActionDefinition`, update resolution logic, update built-in action definitions
2. `packages/core/src/types.ts` — Add `available` to `WidgetActionConfig.extra`
3. `packages/renderer/src/components/DefaultNodeToolbar.ts` — Handle disabled state for drag-handle type
4. `packages/themes/src/components/canvas.css` — Add `.dc-node__toolbar-btn--disabled` class
5. `packages/renderer/src/action-registry.test.ts` — Add tests for three-state model

## Test Cases

- `available: false` renders action as disabled (not hidden)
- `visible: false` hides action entirely
- `available: false` takes precedence over `disabled: false` (action is disabled)
- Combined `available` + `disabled` predicates work correctly
- Backward compatibility: existing actions without `available` behave identically
- Drag-handle with `disabled: true` shows disabled style and prevents drag
