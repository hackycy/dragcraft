# Drag Interaction Enhancement Design

**Date:** 2026-06-24
**Status:** Approved
**Scope:** Material drag preview, slot placeholder, toolbar layering fixes

## Problem Statement

The current drag-and-drop interaction in the designer has several UX gaps compared to mature visual builders (Ant Design Pro Pages, Webflow, Framer):

1. **Toolbar layering issues:** Toolbar gets occluded by other elements, stays visible during drag operations, and overlaps with the property panel.
2. **Browser default drag ghost:** Dragging from the material panel shows the browser's semi-transparent snapshot instead of a polished preview.
3. **Minimal drop indicator:** A static 2px line with no visual weight — users can't easily judge where the widget will land.

## Design Decisions

- **Approach:** HTML5 Drag API + floating preview layer (Plan B). Keep the native drag state management but overlay a custom visual system.
- **Style reference:** Ant Design Pro Pages — clean, enterprise-grade, blue accent color.
- **Drag handle:** Keep existing floating toolbar handle design unchanged.

## Architecture

Three layers are affected; the Core layer is untouched.

| Layer | Package | Changes |
|---|---|---|
| Core | `@dragcraft/core` | None — drag state, sortable constraints, commands unchanged |
| Renderer | `@dragcraft/renderer` | Hide toolbar during drag, replace drop indicator with slot placeholder, hide browser ghost |
| Designer | `@dragcraft/designer` | Floating preview layer management, drag state CSS classes |
| Themes | `@dragcraft/themes` | New CSS for preview/placeholder, toolbar z-index variables |

## Section 1: Custom Drag Preview

### Mechanism

**Hide browser ghost:**
- In `useNodeDrag.handleDragStart` and `DcMaterialItem`'s `dragstart`, create a 1x1 transparent canvas and call `e.dataTransfer.setDragImage(transparentCanvas, 0, 0)` to suppress the default ghost.
- This is the only use of `setDragImage` — purely for hiding, not for displaying custom content.

**Floating preview layer (managed by `useDragDrop`):**

New internal functions in `useDragDrop.ts`:

- `createDragPreview(meta: WidgetMeta | null, sourceEl: HTMLElement)`
  - Creates a `position: fixed` div appended to `document.body`
  - Content: widget icon (from meta) + widget name
  - Style: white card, 120px wide, 8px/12px padding, 6px border-radius, `box-shadow: 0 4px 16px rgba(0,0,0,0.15)`, `opacity: 0.9`
  - For move operations (existing node drag): add a blue border to distinguish from copy

- `updateDragPreviewPosition(e: DragEvent)`
  - Called in `handleCanvasDragOver` and material panel's `dragover`
  - Positions the preview at `(e.clientX + 12, e.clientY + 12)`

- `destroyDragPreview()`
  - Called in `handleDragEnd` and `handleCanvasDrop`
  - Removes the DOM node and clears the ref

**Preview card style (using existing CSS variables from tokens.css):**
- Size: `width: 120px`, `padding: 8px 12px`
- Background: `var(--dc-bg)`, `border-radius: var(--dc-radius-lg)`
- Shadow: `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15)`
- Border: `1px solid var(--dc-border)` (copy) or `1px solid var(--dc-primary)` (move)
- Content: icon (20px) + name (12px, `var(--dc-text-secondary)`)
- Opacity: `0.9`

**Two drag scenarios:**
- Material drag (copy): shows widget meta's `icon` + `name`
- Node drag (move): shows the node's type icon + name with blue border

### API Changes

`useDragDrop` return type adds (internal only, not exposed to consumers):
- `createDragPreview`, `updateDragPreviewPosition`, `destroyDragPreview`

`DcMaterialItem` needs access to `createDragPreview` via `DesignerContext`. The `DesignerContext` type in `packages/designer/src/types.ts` needs to include these preview functions.

## Section 2: Slot Placeholder

### Replace DefaultDropIndicator

The current `DefaultDropIndicator.ts` renders a simple 2px line. The new implementation renders a rounded rectangle placeholder block:

```
+-----------------------------------------+
|  +- - - - - - - - - - - - - - - - - -+  |
|  :         Widget goes here          :  |  <- min-height: 48px
|  +- - - - - - - - - - - - - - - - - -+  |
+-----------------------------------------+
```

**Component interface:** Remains props-free (headless principle). Height is controlled via CSS with `min-height: 48px`.

**CSS style (Ant Design aligned):**
- Background: `rgba(24, 144, 255, 0.06)` (very faint Ant Design primary)
- Border: `2px dashed #1890ff` (Ant Design primary color dashed border)
- Border-radius: `6px`
- Margin: `4px 0` (consistent with widget spacing)
- Animation: `@keyframes dc-fade-in` from `opacity: 0` to `opacity: 1` over `0.15s ease`

**RootRenderer integration:** No changes needed — the existing splice-insertion logic works identically with the new component. The `DropIndicator` key `'__drop-indicator__'` ensures Vue's diff algorithm handles insertion/removal correctly.

## Section 3: Toolbar Layering Fixes

### Fix 1: Z-index Standardization

Define CSS custom properties in the theme's token layer (alongside existing `--dc-primary`, `--dc-border`, etc.):

```css
/* In packages/themes/src/antd/tokens.css (or material/tokens.css) */
:root {
  --dc-z-node: 1;
  --dc-z-mask: 2;
  --dc-z-toolbar: 10;
  --dc-z-toolbar-float: 1000;
  --dc-z-drag-preview: 9999;
}
```

Replace hardcoded z-index values in `widgets.css` with these variables.

### Fix 2: Hide Toolbar During Drag

In `WidgetRenderer.ts`, read `engine.store.dragTarget` and skip toolbar rendering when the current node is being dragged:

```typescript
const isBeingDragged = ctx.engine.store.dragTarget.value?.sourceNodeId === node.id
if (widget.state.isSelected.value && toolbarPosition.value.visible && !isBeingDragged) {
  // render toolbar
}
```

### Fix 3: Right Boundary Detection

Add a `maxRight` option to `useToolbarPosition`. When `left + toolbarWidth > maxRight`, flip the toolbar to the left side of the widget.

`DcCanvas` provides the property panel's left boundary via `provide`. `WidgetRenderer` reads it from context and passes it to `useToolbarPosition`.

## Section 4: Drag State Feedback

### Canvas State Class

`DcCanvas` adds `.dc-canvas--dragging` class when `dragTarget.value !== null`. Used for potential future CSS hooks.

### Material Panel Source State

`DcMaterialItem` adds `.dc-material-item--dragging` class during drag:
- `opacity: 0.5` — source item dims to indicate "being dragged away"
- Removed on `dragend`

## CSS Changes Summary

### New

```css
/* Floating drag preview */
.dc-drag-preview {
  position: fixed;
  z-index: var(--dc-z-drag-preview);
  width: 120px;
  padding: 8px 12px;
  background: var(--dc-bg);
  border: 1px solid var(--dc-border);
  border-radius: var(--dc-radius-lg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  opacity: 0.9;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--dc-text-secondary);
}

.dc-drag-preview--move {
  border-color: var(--dc-primary);
}

/* Slot placeholder (replaces .dc-drop-indicator__line) */
.dc-drop-indicator {
  min-height: 48px;
  background: var(--dc-primary-bg-hover);
  border: 2px dashed var(--dc-primary);
  border-radius: var(--dc-radius-lg);
  margin: 4px 0;
  animation: dc-fade-in 0.15s ease;
}

@keyframes dc-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Material item dragging state */
.dc-material-item--dragging {
  opacity: 0.5;
}
```

### Modified

```css
/* Toolbar z-index variables */
.dc-node__toolbar { z-index: var(--dc-z-toolbar); }
.dc-node__toolbar--floating { z-index: var(--dc-z-toolbar-float); }
```

### Removed

```css
/* .dc-drop-indicator__line — replaced by slot placeholder */
```

### Token additions (in tokens.css)

```css
--dc-z-node: 1;
--dc-z-mask: 2;
--dc-z-toolbar: 10;
--dc-z-toolbar-float: 1000;
--dc-z-drag-preview: 9999;
```

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `packages/designer/src/composables/useDragDrop.ts` | Modify | Add floating preview layer create/update/destroy |
| `packages/designer/src/components/DcMaterialItem.ts` | Modify | Call preview API on dragstart, add dragging class |
| `packages/designer/src/components/DcCanvas.ts` | Modify | Add dragging state class |
| `packages/renderer/src/components/WidgetRenderer.ts` | Modify | Hide toolbar when node is being dragged |
| `packages/renderer/src/components/DefaultDropIndicator.ts` | Rewrite | Slot placeholder component |
| `packages/renderer/src/composables/useNodeDrag.ts` | Modify | setDragImage to hide browser ghost |
| `packages/renderer/src/composables/useToolbarPosition.ts` | Modify | Add maxRight option |
| `packages/themes/src/components/canvas.css` | Modify | Drag state classes |
| `packages/themes/src/components/widgets.css` | Modify | Toolbar z-index variable-ization |
| `packages/themes/src/antd/tokens.css` | Modify | Add z-index variables |
| `packages/themes/src/material/tokens.css` | Modify | Add z-index variables |
| `packages/themes/src/components/material-panel.css` | Modify | Dragging source state |
| `packages/designer/src/types.ts` | Modify | DesignerContext add preview API |

## Unchanged

- `useNodeDrag` — drag handle interaction logic
- `action-registry` — action registration and visibility
- `sortable.ts` — constraint logic
- `RootRenderer` — indicator insertion logic (only the indicator component itself changes)
- Core commands (`add-node.ts`, `move-node.ts`, `remove-node.ts`)
