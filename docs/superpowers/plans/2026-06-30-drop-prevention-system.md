# Drop Prevention System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show three-layer forbidden feedback (drag preview, canvas overlay, cursor) when a singleton widget type already exists in the canvas during drag-over.

**Architecture:** Reuses the existing `creatable` predicate on `WidgetMeta`, re-evaluated during drag-over via a new `isDropAllowed` computed in `useDragDrop`. The `isForbidden` ref propagates from designer context through `DcCanvas` to `RootRenderer` as a prop, driving overlay rendering and CSS class toggling.

**Tech Stack:** Vue 3 (Composition API, defineComponent, h()), HTML5 Drag and Drop API, CSS custom properties

## Global Constraints

- No Unicode character emojis -- use SVG icons only
- No `structuredClone`
- All packages must import via pnpm workspace (`@dragcraft/...`)
- `pnpm build`, `pnpm lint`, `pnpm typecheck` must pass after all tasks
- Match existing code style (defineComponent + h() for components, composable pattern for logic)

---

### Task 1: Add `isForbidden` to DesignerContext and `UseDragDropReturn`

**Files:**
- Modify: `packages/designer/src/types.ts:146-165`
- Modify: `packages/designer/src/composables/useDragDrop.ts:11-38`

**Interfaces:**
- Consumes: `DesignerEngine` (from `@dragcraft/core`), `resolveBehavior` (from `@dragcraft/core`)
- Produces: `isForbidden: Ref<boolean>` on `DesignerContext` and `UseDragDropReturn`

- [ ] **Step 1: Add `isForbidden` to `UseDragDropReturn`**

In `packages/designer/src/composables/useDragDrop.ts`, add `isForbidden` to the return type interface:

```ts
export interface UseDragDropReturn {
  // ... existing fields ...
  /** Whether the current drag-over is forbidden (widget type already exists) */
  isForbidden: Ref<boolean>
  /** Remove the floating preview element */
  destroyDragPreview: () => void
}
```

- [ ] **Step 2: Add `isForbidden` to `DesignerContext`**

In `packages/designer/src/types.ts`, add to the `DesignerContext` interface:

```ts
export interface DesignerContext {
  // ... existing fields ...
  /** Whether the current drag-over is forbidden (widget type blocked by creatable predicate) */
  isForbidden: Ref<boolean>
  searchQuery: Ref<string>
  activeTab: Ref<PropertyTabKey>
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/designer/src/types.ts packages/designer/src/composables/useDragDrop.ts
git commit -m "feat(designer): add isForbidden to DesignerContext and UseDragDropReturn"
```

---

### Task 2: Implement `isDropAllowed` computed and `isForbidden` ref in `useDragDrop`

**Files:**
- Modify: `packages/designer/src/composables/useDragDrop.ts`

**Interfaces:**
- Consumes: `resolveBehavior` from `@dragcraft/core`, `engine.store.dragTarget`, `engine.store.schema`, `engine.registry`
- Produces: `isForbidden: Ref<boolean>`, `isDropAllowed: ComputedRef<boolean>` (internal)

- [ ] **Step 1: Add `isForbidden` ref and `isDropAllowed` computed**

In `packages/designer/src/composables/useDragDrop.ts`, after the existing `validDropIndices` computed (around line 70), add:

```ts
const isForbidden = ref(false)

const isDropAllowed = computed(() => {
  const target = engine.store.dragTarget.value
  if (!target?.widgetType) return true // node move, not material drop
  const meta = engine.registry.getWidget(target.widgetType)
  if (!meta) return true
  return resolveBehavior(meta.creatable, {
    widgetType: target.widgetType,
    schema: engine.store.schema.value,
  }, true)
})
```

- [ ] **Step 2: Wire `isForbidden` into `handleCanvasDragOver`**

In `handleCanvasDragOver` (around line 164), add the forbidden check at the start of the function, after `e.preventDefault()` and `dragOverNodeId.value = 'root'`:

```ts
function handleCanvasDragOver(e: DragEvent): void {
  e.preventDefault()
  dragOverNodeId.value = 'root'
  const dragTarget = engine.store.dragTarget.value
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = dragTarget?.sourceNodeId ? 'move' : 'copy'
  }

  // Check if drop is allowed by creatable predicate
  if (!isDropAllowed.value) {
    isForbidden.value = true
    dragOverIndex.value = null
    updateDragPreviewPosition(e)
    return
  }
  isForbidden.value = false

  // ... rest of existing logic (computeDropIndex, validDropIndices, etc.) ...
```

- [ ] **Step 3: Wire `isForbidden` into `handleCanvasDrop`**

In `handleCanvasDrop` (around line 214), add the forbidden guard after the `if (!dragTarget) return` check:

```ts
function handleCanvasDrop(e: DragEvent): void {
  destroyDragPreview()
  e.preventDefault()
  dragOverNodeId.value = null
  const visualIndex = dragOverIndex.value
  dragOverIndex.value = null
  isForbidden.value = false

  const dragTarget = engine.store.dragTarget.value
  if (!dragTarget)
    return

  // Forbidden drop (creatable predicate returned false)
  if (!isDropAllowed.value) {
    engine.store.setDragTarget(null)
    return
  }

  // ... rest of existing logic ...
```

- [ ] **Step 4: Wire `isForbidden` into `handleDragEnd`**

In `handleDragEnd` (around line 281), reset `isForbidden`:

```ts
function handleDragEnd(_e: DragEvent): void {
  destroyDragPreview()
  dragOverNodeId.value = null
  dragOverIndex.value = null
  isForbidden.value = false
  engine.store.setDragTarget(null)
}
```

- [ ] **Step 5: Wire `isForbidden` into `handleCanvasDragLeave`**

In `handleCanvasDragLeave` (around line 204), reset `isForbidden` when leaving the canvas:

```ts
function handleCanvasDragLeave(e: DragEvent): void {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const canvasEl = e.currentTarget as HTMLElement
  if (!relatedTarget || !canvasEl.contains(relatedTarget)) {
    dragOverNodeId.value = null
    dragOverIndex.value = null
    isForbidden.value = false
  }
}
```

- [ ] **Step 6: Add `isForbidden` to the return object**

In the return statement (around line 288), add `isForbidden`:

```ts
return {
  dragOverNodeId,
  dragOverIndex,
  isForbidden,
  lockedIndices,
  validDropIndices,
  handleMaterialDragStart,
  handleNodeDragStart,
  handleCanvasDragOver,
  handleCanvasDragLeave,
  handleCanvasDrop,
  handleDragEnd,
  createDragPreview,
  updateDragPreviewPosition,
  destroyDragPreview,
}
```

- [ ] **Step 7: Verify typecheck passes**

Run: `pnpm --filter @dragcraft/designer typecheck`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/designer/src/composables/useDragDrop.ts
git commit -m "feat(designer): add isDropAllowed computed and isForbidden state to useDragDrop"
```

---

### Task 3: Add forbidden drag preview class toggling

**Files:**
- Modify: `packages/designer/src/composables/useDragDrop.ts`

**Interfaces:**
- Consumes: `isForbidden` ref (from Task 2), `dragPreviewEl` (existing internal variable)
- Produces: `dc-drag-preview--forbidden` class on the preview DOM element

- [ ] **Step 1: Add watch for isForbidden to toggle preview class**

In `packages/designer/src/composables/useDragDrop.ts`, import `watch` from `vue` (add to existing import on line 5), then add a watcher after the `isForbidden` ref declaration:

```ts
import { computed, ref, watch } from 'vue'
```

After the `isDropAllowed` computed, add:

```ts
watch(isForbidden, (forbidden) => {
  if (dragPreviewEl) {
    dragPreviewEl.classList.toggle('dc-drag-preview--forbidden', forbidden)
  }
})
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm --filter @dragcraft/designer typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/designer/src/composables/useDragDrop.ts
git commit -m "feat(designer): toggle forbidden class on drag preview"
```

---

### Task 4: Wire `isForbidden` through `DcDesigner` context and `DcCanvas`

**Files:**
- Modify: `packages/designer/src/components/DcDesigner.ts:30-49`
- Modify: `packages/designer/src/components/DcCanvas.ts`

**Interfaces:**
- Consumes: `isForbidden` from `useDragDrop` return (Task 2)
- Produces: `isForbidden` passed as prop to `RootRenderer`, `dc-canvas--forbidden` class on canvas div

- [ ] **Step 1: Add `isForbidden` to the DesignerContext in DcDesigner**

In `packages/designer/src/components/DcDesigner.ts`, add `isForbidden` to the context object (around line 30):

```ts
const ctx: DesignerContext = {
  engine,
  componentMap,
  widgetGroups,
  extensions,
  fieldComponentMap,
  globalConfigSchema,
  eventHooks,
  actionRegistry,
  dragOverNodeId: dragDrop.dragOverNodeId,
  dragOverIndex: dragDrop.dragOverIndex,
  isForbidden: dragDrop.isForbidden,
  handleCanvasDragOver: dragDrop.handleCanvasDragOver,
  handleCanvasDragLeave: dragDrop.handleCanvasDragLeave,
  handleCanvasDrop: dragDrop.handleCanvasDrop,
  createDragPreview: dragDrop.createDragPreview,
  updateDragPreviewPosition: dragDrop.updateDragPreviewPosition,
  destroyDragPreview: dragDrop.destroyDragPreview,
  searchQuery,
  activeTab,
}
```

- [ ] **Step 2: Destructure `isForbidden` and pass to RootRenderer in DcCanvas**

In `packages/designer/src/components/DcCanvas.ts`, add `isForbidden` to the destructured context (around line 11):

```ts
const {
  engine,
  componentMap,
  extensions,
  dragOverNodeId,
  dragOverIndex,
  isForbidden,
  handleCanvasDragOver,
  handleCanvasDragLeave,
  handleCanvasDrop,
  eventHooks,
  actionRegistry,
} = ctx
```

- [ ] **Step 3: Pass `isForbidden` as prop to RootRenderer**

In the render function of `DcCanvas.ts` (around line 56), add `isForbidden` to the RootRenderer props:

```ts
h(RootRenderer, {
  engine,
  componentMap,
  extensions: rendererExtensions.value,
  eventHooks,
  actionRegistry,
  dragOverNodeId,
  dragOverIndex,
  isForbidden,
  toolbarMaxRight,
}),
```

- [ ] **Step 4: Add `dc-canvas--forbidden` class binding**

In the render function of `DcCanvas.ts` (around line 47), add the forbidden class:

```ts
class: ['dc-canvas', {
  'dc-canvas--dragging': isDragging.value,
  'dc-canvas--forbidden': isForbidden.value && isDragging.value,
}],
```

- [ ] **Step 5: Verify typecheck passes**

Run: `pnpm --filter @dragcraft/designer typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/designer/src/components/DcDesigner.ts packages/designer/src/components/DcCanvas.ts
git commit -m "feat(designer): wire isForbidden through context and canvas"
```

---

### Task 5: Add `ForbiddenOverlayProps`, `forbiddenOverlay` extension, and `isForbidden` prop to renderer types

**Files:**
- Modify: `packages/renderer/src/types.ts`

**Interfaces:**
- Consumes: `Component` from `vue`, `Ref` from `vue`
- Produces: `ForbiddenOverlayProps`, `RendererExtensions.forbiddenOverlay`, `RendererOptions.isForbidden`

- [ ] **Step 1: Add `ForbiddenOverlayProps` interface**

In `packages/renderer/src/types.ts`, add after the `EmptyStateProps` interface (around line 103):

```ts
/**
 * Props received by a custom forbiddenOverlay component.
 */
export interface ForbiddenOverlayProps {
  /** The widget type that was blocked */
  widgetType: string
}
```

- [ ] **Step 2: Add `forbiddenOverlay` to `RendererExtensions`**

In the `RendererExtensions` interface (around line 119), add:

```ts
export interface RendererExtensions {
  // ... existing fields ...

  /**
   * Replaces the default forbidden overlay shown when a widget type
   * cannot be dropped (e.g., singleton already exists).
   * Receives ForbiddenOverlayProps.
   */
  forbiddenOverlay?: Component
}
```

- [ ] **Step 3: Add `isForbidden` to `RendererOptions`**

In the `RendererOptions` interface (around line 183), add:

```ts
export interface RendererOptions {
  // ... existing fields ...

  /**
   * Optional reactive ref indicating the current drag-over is forbidden.
   * When true and dragOverNodeId is 'root', the forbidden overlay is shown
   * instead of the drop indicator.
   * Managed externally by the designer package.
   */
  isForbidden?: Ref<boolean>
}
```

- [ ] **Step 4: Verify typecheck passes**

Run: `pnpm --filter @dragcraft/renderer typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/renderer/src/types.ts
git commit -m "feat(renderer): add ForbiddenOverlayProps and forbiddenOverlay extension point"
```

---

### Task 6: Add i18n messages for forbidden overlay

**Files:**
- Modify: `packages/renderer/src/messages.ts`

**Interfaces:**
- Consumes: `MessageTree` type from `@dragcraft/utils`
- Produces: `forbidden.alreadyExists` message key in zh-CN and en locales

- [ ] **Step 1: Add forbidden messages**

In `packages/renderer/src/messages.ts`, add the `forbidden` section to both locales:

```ts
export const rendererMessages: Record<string, MessageTree> = {
  'zh-CN': {
    action: {
      'drag': '拖拽排序',
      'move-up': '上移',
      'move-down': '下移',
      'delete': '删除',
    },
    canvas: {
      'empty': '拖拽组件到这里',
      'node-handle': '选中组件',
    },
    forbidden: {
      'alreadyExists': '无法添加 — 该类型已存在',
    },
  },
  'en': {
    action: {
      'drag': 'Drag to sort',
      'move-up': 'Move up',
      'move-down': 'Move down',
      'delete': 'Delete',
    },
    canvas: {
      'empty': 'Drag components here',
      'node-handle': 'Select component',
    },
    forbidden: {
      'alreadyExists': 'Cannot add — this type already exists',
    },
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/renderer/src/messages.ts
git commit -m "feat(renderer): add i18n messages for forbidden overlay"
```

---

### Task 7: Create `DefaultForbiddenOverlay` component

**Files:**
- Create: `packages/renderer/src/components/DefaultForbiddenOverlay.ts`
- Modify: `packages/renderer/src/components/index.ts`

**Interfaces:**
- Consumes: `useI18n` from `@dragcraft/utils`, `ForbiddenOverlayProps` from `../types`
- Produces: `DefaultForbiddenOverlay` Vue component (exported from renderer package)

- [ ] **Step 1: Create DefaultForbiddenOverlay component**

Create `packages/renderer/src/components/DefaultForbiddenOverlay.ts`:

```ts
import type { PropType } from 'vue'
import { useI18n } from '@dragcraft/utils'
import { defineComponent, h } from 'vue'

/**
 * Default forbidden overlay shown when a widget type cannot be dropped
 * (e.g., singleton widget already exists in the canvas).
 * Renders a semi-transparent red overlay with a ban icon and message.
 */
export default defineComponent({
  name: 'DcDefaultForbiddenOverlay',

  props: {
    widgetType: {
      type: String as PropType<string>,
      required: true,
    },
  },

  setup(props) {
    const { t } = useI18n()
    return () =>
      h('div', { class: 'dc-forbidden-overlay' }, [
        h('span', { class: 'dc-forbidden-overlay__icon' }, [
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '24',
            height: '24',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          }, [
            h('circle', { cx: '12', cy: '12', r: '10' }),
            h('line', { x1: '4.93', y1: '4.93', x2: '19.07', y2: '19.07' }),
          ]),
        ]),
        h('span', { class: 'dc-forbidden-overlay__text' },
          t('forbidden.alreadyExists', 'Cannot add — this type already exists'),
        ),
      ])
  },
})
```

- [ ] **Step 2: Export from components index**

In `packages/renderer/src/components/index.ts`, add the export:

```ts
export { default as DefaultContainerShell } from './DefaultContainerShell'
export { default as DefaultDropIndicator } from './DefaultDropIndicator'
export { default as DefaultEmptyState } from './DefaultEmptyState'
export { default as DefaultForbiddenOverlay } from './DefaultForbiddenOverlay'
export { default as DefaultNodeHandle } from './DefaultNodeHandle'
export { default as DefaultNodeMask } from './DefaultNodeMask'
export { default as DefaultNodeToolbar } from './DefaultNodeToolbar'
export { default as DefaultWidgetFallback } from './DefaultWidgetFallback'
export { default as RootRenderer } from './RootRenderer'
export { default as WidgetRenderer } from './WidgetRenderer'
```

- [ ] **Step 3: Export from package index**

In `packages/renderer/src/index.ts`, add `DefaultForbiddenOverlay` to the components export and `ForbiddenOverlayProps` to the types export:

```ts
// Components export (around line 12)
export {
  DefaultContainerShell,
  DefaultDropIndicator,
  DefaultEmptyState,
  DefaultForbiddenOverlay,
  DefaultNodeHandle,
  DefaultNodeMask,
  DefaultNodeToolbar,
  DefaultWidgetFallback,
  RootRenderer,
  WidgetRenderer,
} from './components'

// Types export (around line 49)
export type {
  ComponentMap,
  EmptyStateProps,
  ForbiddenOverlayProps,
  NodeHandleProps,
  NodeInteractionState,
  NodeMaskProps,
  NodeToolbarProps,
  NodeWrapperProps,
  RendererContext,
  RendererExtensions,
  RendererOptions,
  ToolbarPositionData,
  WidgetFallbackProps,
} from './types'
```

- [ ] **Step 4: Verify typecheck passes**

Run: `pnpm --filter @dragcraft/renderer typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/renderer/src/components/DefaultForbiddenOverlay.ts packages/renderer/src/components/index.ts packages/renderer/src/index.ts
git commit -m "feat(renderer): add DefaultForbiddenOverlay component"
```

---

### Task 8: Wire `isForbidden` prop and forbidden overlay into `RootRenderer`

**Files:**
- Modify: `packages/renderer/src/components/RootRenderer.ts`

**Interfaces:**
- Consumes: `isForbidden` prop (Ref<boolean>), `forbiddenOverlay` from extensions, `DefaultForbiddenOverlay`
- Produces: `ForbiddenOverlay` rendered in canvas when forbidden, drop indicator suppressed

- [ ] **Step 1: Add `isForbidden` prop to RootRenderer**

In `packages/renderer/src/components/RootRenderer.ts`, add the `isForbidden` prop (around line 46, after `toolbarMaxRight`):

```ts
isForbidden: {
  type: Object as PropType<Ref<boolean>>,
  default: undefined,
},
```

- [ ] **Step 2: Import DefaultForbiddenOverlay**

Add the import at the top of the file (around line 9):

```ts
import DefaultForbiddenOverlay from './DefaultForbiddenOverlay'
```

- [ ] **Step 3: Resolve forbidden overlay component**

In the `setup` function, after the `ContainerShell` computed (around line 68), add:

```ts
const ForbiddenOverlay = computed(
  () => props.extensions?.forbiddenOverlay ?? DefaultForbiddenOverlay,
)
```

- [ ] **Step 4: Modify render logic to show forbidden overlay**

In the render function (around line 84), replace the existing drop indicator logic:

```ts
// Current code (lines 84-93):
// Show drop indicator at the computed insertion index
if (isDragOver) {
  const idx = props.dragOverIndex?.value
  if (idx != null && idx >= 0 && idx <= childVNodes.length) {
    childVNodes.splice(idx, 0, h(DropIndicator, { key: '__drop-indicator__' }))
  }
  else {
    childVNodes.push(h(DropIndicator, { key: '__drop-indicator__' }))
  }
}

// Replace with:
const isForbidden = props.isForbidden?.value ?? false

if (isDragOver && isForbidden) {
  childVNodes.push(h(ForbiddenOverlay.value, {
    key: '__forbidden__',
    widgetType: props.engine.store.dragTarget.value?.widgetType ?? '',
  }))
}
else if (isDragOver) {
  const idx = props.dragOverIndex?.value
  if (idx != null && idx >= 0 && idx <= childVNodes.length) {
    childVNodes.splice(idx, 0, h(DropIndicator, { key: '__drop-indicator__' }))
  }
  else {
    childVNodes.push(h(DropIndicator, { key: '__drop-indicator__' }))
  }
}
```

- [ ] **Step 5: Verify typecheck passes**

Run: `pnpm --filter @dragcraft/renderer typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/renderer/src/components/RootRenderer.ts
git commit -m "feat(renderer): wire isForbidden prop and forbidden overlay into RootRenderer"
```

---

### Task 9: Add CSS for forbidden states

**Files:**
- Modify: `packages/themes/src/components/canvas.css`
- Modify: `packages/themes/src/components/designer.css`

**Interfaces:**
- Consumes: CSS class names: `.dc-canvas--forbidden`, `.dc-forbidden-overlay`, `.dc-drag-preview--forbidden`
- Produces: Visual styles for forbidden drag-over state

- [ ] **Step 1: Add `position: relative` to existing `.dc-container-shell` rule**

In `packages/themes/src/components/canvas.css`, modify the existing `.dc-container-shell` rule (around line 21) to add positioning context for the forbidden overlay:

```css
.dc-container-shell {
  min-height: 200px;
  position: relative;
}
```

- [ ] **Step 2: Add forbidden canvas and overlay styles to canvas.css**

Append to `packages/themes/src/components/canvas.css`:

```css
/* ── Canvas Forbidden State ─────────────── */

.dc-canvas--forbidden {
  cursor: not-allowed !important;
}

/* ── Forbidden Overlay ──────────────────── */

.dc-forbidden-overlay {
  position: absolute;
  inset: 0;
  background: rgba(239, 68, 68, 0.08);
  border: 2px dashed var(--dc-color-danger, #ef4444);
  border-radius: var(--dc-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--dc-color-danger, #ef4444);
  font-size: var(--dc-font-size-sm, 14px);
  pointer-events: none;
  z-index: 10;
  animation: dc-forbidden-pulse 1.5s ease-in-out infinite;
}

.dc-forbidden-overlay__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.dc-forbidden-overlay__text {
  white-space: nowrap;
}

@keyframes dc-forbidden-pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}
```

- [ ] **Step 3: Add forbidden drag preview style to designer.css**

Append to `packages/themes/src/components/designer.css`:

```css
/* ── Drag Preview Forbidden State ───────── */

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
```

- [ ] **Step 4: Commit**

```bash
git add packages/themes/src/components/canvas.css packages/themes/src/components/designer.css
git commit -m "feat(themes): add CSS for forbidden drag-over states"
```

---

### Task 10: Verify full build passes

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck across all packages**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Run lint across all packages**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: Run build across all packages**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 4: Commit any fixups if needed**

If any fixes were needed:
```bash
git add -A
git commit -m "fix: resolve build/lint/typecheck issues for drop prevention system"
```
