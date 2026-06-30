# Drop Prevention System Design

**Date**: 2026-06-30
**Status**: Approved
**Scope**: designer, renderer packages (core unchanged)

## Problem

When a singleton widget (e.g., `navbar`) already exists in the canvas, dragging another instance from the material panel should show clear "forbidden" feedback on the device frame. Currently, the `creatable` predicate gates the material item as non-draggable at render time, but there is no real-time canvas-level feedback during drag-over when a drop would violate the constraint.

### Example Scenario

A mini-program page has a `navbar` at the top (locked, `sortable: false`). The user drags a second `navbar` from the material panel. Currently:
- If `creatable` is a static `false`, the item is disabled -- user cannot start dragging (good, but inflexible).
- If `creatable` is a dynamic predicate, the item is draggable. The drag starts, the user hovers over the canvas, and... nothing happens. The drop is silently rejected. No visual explanation.

**Goal**: Three-layer visual feedback (drag preview, canvas overlay, cursor) that clearly communicates "this drop is forbidden" with an extensible predicate mechanism.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Mechanism | Reuse existing `creatable` predicate | Zero new API surface; existing predicates just work |
| Visual layers | Drag preview + canvas overlay + cursor | Maximum clarity at every interaction point |
| Forbidden drag preview | Dynamic transition mid-drag | Robust against external schema changes |
| Drop indicator | Suppress when forbidden | Avoid mixed signals (green line + red overlay) |
| Overlay component | Extension point | Users can customize the forbidden UX |

## Architecture

### Evaluation Points

The `creatable` predicate is evaluated at three points, all using the same `resolveBehavior(meta.creatable, ctx, true)` call:

```
Material Panel              Canvas (drag-over)              Drop Handler
┌─────────────────┐    ┌──────────────────────────┐    ┌───────────────────┐
│ 1. Render time   │    │ 2. Every dragover event  │    │ 3. drop event     │
│                  │    │                          │    │                   │
│ ctx = {          │    │ ctx = {                  │    │ ctx = {           │
│   widgetType,    │    │   widgetType,            │    │   widgetType,     │
│   schema (snap)  │    │   schema (live reactive) │    │   schema (live)   │
│ }                │    │ }                        │    │ }                 │
│                  │    │                          │    │                   │
│ false →          │    │ false →                  │    │ false →           │
│  item disabled   │    │  isForbidden = true      │    │  no-op (return)   │
│  not draggable   │    │  show overlay + cursor   │    │                   │
│                  │    │  suppress drop indicator │    │ true →            │
│ true →           │    │  update preview class    │    │  dispatch         │
│  draggable       │    │                          │    │  ADD_NODE         │
│                  │    │ true →                   │    │                   │
│                  │    │  existing drop logic     │    │                   │
└─────────────────┘    └──────────────────────────┘    └───────────────────┘
```

**Key insight**: Point 1 uses a snapshot (schema at render time). Points 2 and 3 use the live reactive schema. This means if the schema changes mid-drag (e.g., a `navbar` is programmatically added), the drag preview transitions to forbidden state in real time.

### Data Flow

```
useDragDrop composable
├── isForbidden (ref<boolean>)       ← driven by isDropAllowed computed
├── isDropAllowed (computed)         ← re-evaluates creatable on every schema change
│   └── reads: dragTarget.widgetType, engine.store.schema
│   └── calls: resolveBehavior(meta.creatable, ctx, true)
│
├── handleCanvasDragOver()
│   ├── if !isDropAllowed → dragOverIndex = null, isForbidden = true
│   └── if isDropAllowed → compute index, constrain, isForbidden = false
│
├── handleCanvasDrop()
│   └── if !isDropAllowed → return (no-op)
│
└── Drag preview
    └── classList toggle: dc-drag-preview--forbidden (on isForbidden change)
```

## Changes by Package

### designer package

#### `useDragDrop.ts` -- Core coordination

Add `isDropAllowed` computed and `isForbidden` ref:

```ts
const isForbidden = ref(false)

const isDropAllowed = computed(() => {
  const target = engine.store.dragTarget
  if (!target.widgetType) return true // node move, not material drop
  const meta = engine.registry.getWidget(target.widgetType)
  if (!meta) return true
  return resolveBehavior(meta.creatable, {
    widgetType: target.widgetType,
    schema: engine.store.schema,
  }, true)
})
```

Modify `handleCanvasDragOver`:
- Before computing drop index, check `isDropAllowed.value`
- If `false`: set `dragOverIndex.value = null`, `isForbidden.value = true`, return
- If `true`: existing logic, `isForbidden.value = false`

Modify `handleCanvasDrop`:
- Early return if `!isDropAllowed.value`

Modify drag preview:
- Add/remove `dc-drag-preview--forbidden` class on the preview element when `isForbidden` changes
- Use a `watch` on `isForbidden` that targets the existing preview DOM element

Expose `isForbidden` in the `DesignerContext` so `DcCanvas` can read it.

#### `DcCanvas.ts` -- Cursor feedback + prop forwarding

Pass `isForbidden` to `RootRenderer` as a prop (same pattern as `dragOverNodeId` / `dragOverIndex`):

```ts
h(RootRenderer, {
  engine,
  componentMap,
  extensions: rendererExtensions.value,
  eventHooks,
  actionRegistry,
  dragOverNodeId,
  dragOverIndex,
  isForbidden,  // new
  toolbarMaxRight,
})
```

Add class binding on the canvas div:
```ts
'dc-canvas--forbidden': isForbidden.value && isDragging.value
```

#### `DcMaterialItem.ts` -- No changes

Existing `isCreatable` computed already handles the material panel gating. The predicate is the same one re-evaluated during drag-over.

### renderer package

#### `RootRenderer.ts` -- Forbidden overlay rendering

Add `isForbidden` prop (type `Ref<boolean>`, same pattern as existing `dragOverNodeId` / `dragOverIndex` props). `DcCanvas` passes it from the `DesignerContext`.

When `isForbidden` is true and `isDragOver` is true:
- Do NOT render `DropIndicator` (suppress the green line)
- Render `ForbiddenOverlay` component inside the container shell

The overlay is rendered after the widget list, covering the canvas content area:

```ts
// Pseudocode in RootRenderer render function
const isForbidden = props.isForbidden?.value ?? false

if (isDragOver && isForbidden) {
  childVNodes.push(h(ForbiddenOverlay, { key: '__forbidden__' }))
} else if (isDragOver) {
  // existing drop indicator logic
  const idx = props.dragOverIndex?.value
  if (idx != null && idx >= 0 && idx <= childVNodes.length) {
    childVNodes.splice(idx, 0, h(DropIndicator, { key: '__drop-indicator__' }))
  }
}
```

#### `DefaultForbiddenOverlay.ts` -- New component

A stateless component rendering a semi-transparent red overlay with a message:

```html
<div class="dc-forbidden-overlay">
  <span class="dc-forbidden-overlay__icon"><!-- SVG ban icon --></span>
  <span class="dc-forbidden-overlay__text">
    {{ t('forbidden.alreadyExists', { type: widgetTitle }) }}
  </span>
</div>
```

Note: Uses an SVG ban icon (not Unicode emoji) per project conventions.

Props: `{ widgetType: string, icon?: string }`

Uses i18n for the message text. Falls back to `"Cannot add {type} — already exists"` if no i18n key matches.

#### `types.ts` -- Extension point

Add to `RendererExtensions`:

```ts
/** Custom forbidden overlay component. Replaces DefaultForbiddenOverlay. */
forbiddenOverlay?: Component
```

This allows users to provide their own forbidden UX (e.g., a toast notification instead of an overlay).

### themes package

Add CSS for the three new classes:

```css
/* Drag preview forbidden state */
.dc-drag-preview--forbidden {
  border-color: var(--dc-color-danger, #ef4444);
  background: var(--dc-color-danger-light, #fef2f2);
  cursor: not-allowed;
  position: relative;
}
.dc-drag-preview--forbidden::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cline x1='10' y1='10' x2='90' y2='90' stroke='%23ef4444' stroke-width='8' stroke-linecap='round'/%3E%3C/svg%3E") center/60% no-repeat;
  opacity: 0.5;
  pointer-events: none;
}

/* Canvas cursor during forbidden drag */
.dc-canvas--forbidden {
  cursor: not-allowed !important;
}

/* Canvas overlay */
.dc-forbidden-overlay {
  position: absolute;
  inset: 0;
  background: rgba(239, 68, 68, 0.08);
  border: 2px dashed var(--dc-color-danger, #ef4444);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--dc-color-danger, #ef4444);
  font-size: 14px;
  pointer-events: none;
  z-index: 10;
  animation: dc-forbidden-pulse 1.5s ease-in-out infinite;
}

@keyframes dc-forbidden-pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}
```

### i18n

Add message keys:

```ts
'forbidden.alreadyExists': 'Cannot add {type} — already exists in the page'
```

## User-Facing API

**No new API surface.** Users define `creatable` on `WidgetMeta` as they already do:

```ts
const navbarMeta: WidgetMeta = {
  type: 'navbar',
  title: 'Navigation Bar',
  group: 'navigation',
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(c => c.type === 'navbar')
  },
  // ... other fields
}
```

The system automatically:
1. Disables the material item when `creatable` returns false at render time
2. Shows forbidden feedback on the canvas during drag-over
3. Blocks the drop

**For custom forbidden UX**, users can provide a `forbiddenOverlay` extension:

```ts
createDesigner({
  extensions: {
    forbiddenOverlay: MyCustomForbiddenComponent,
  },
})
```

## Example: Singleton Navbar

```ts
// playground/src/widgets/NavbarWidget.ts
export const navbarWidgetMeta: WidgetMeta = {
  type: 'navbar',
  title: 'Navigation Bar',
  group: 'navigation',
  icon: 'navbar',
  draggable: false,
  sortable: false,
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(c => c.type === 'navbar')
  },
  // ... defaultProps, defaultStyle, formSchema
}
```

**Behavior**:
- Canvas has no navbar → material item is draggable, drop works normally
- Canvas has a navbar → material item is disabled (panel), dragging shows forbidden UX (canvas)
- User starts dragging when no navbar exists, then navbar is added programmatically → drag preview transitions to forbidden state in real time

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `packages/designer/src/composables/useDragDrop.ts` | Modify | Add `isDropAllowed` computed, `isForbidden` ref, wire into handlers and preview |
| `packages/designer/src/components/DcCanvas.ts` | Modify | Add `dc-canvas--forbidden` class binding |
| `packages/designer/src/types.ts` | Modify | Add `isForbidden` to `DesignerContext` |
| `packages/renderer/src/components/RootRenderer.ts` | Modify | Add `isForbidden` prop, render `ForbiddenOverlay` when forbidden, suppress drop indicator |
| `packages/renderer/src/components/DefaultForbiddenOverlay.ts` | Create | New forbidden overlay component |
| `packages/renderer/src/types.ts` | Modify | Add `forbiddenOverlay` to `RendererExtensions` |
| `packages/themes/src/components/canvas.css` | Modify | Add CSS classes for forbidden states (`.dc-canvas--forbidden`, `.dc-forbidden-overlay`) |
| `packages/themes/src/components/designer.css` | Modify | Add `.dc-drag-preview--forbidden` styles |

## Non-Goals

- **Nested drop prevention**: The schema is flat (root → children), so there is no nested drop target to validate.
- **Partial drop** (drop some children but not others): Not applicable to the flat model.
- **Custom drag previews per forbidden reason**: The preview shows a generic "blocked" state. Specific reasons appear in the canvas overlay, not the preview. This keeps the preview lightweight (raw DOM, no Vue rendering).
- **Animation of the forbidden transition**: A simple class toggle with CSS transitions. No complex state machine for the drag preview lifecycle.
