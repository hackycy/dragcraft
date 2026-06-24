# Drag Interaction Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the browser's default drag ghost with a custom floating preview, swap the 2px drop-indicator line for a slot-style placeholder, and fix toolbar layering issues (z-index, hide-on-drag, right-boundary clamping).

**Architecture:** Keep HTML5 Drag API for state management; overlay a custom `position: fixed` preview div managed by `useDragDrop`. The drop indicator component is rewritten in place (same component name, new visual). Toolbar z-index values are extracted into CSS custom properties. A new `maxRight` option on `useToolbarPosition` prevents toolbar-property-panel overlap.

**Tech Stack:** Vue 3 (Composition API, `defineComponent` + `h()`), TypeScript, Vitest, CSS custom properties.

## Global Constraints

- No `structuredClone` usage (project rule).
- No Unicode emoji in code or comments.
- Each package imports dependencies through pnpm workspace protocol.
- All changes must pass `pnpm build`, `pnpm lint`, `pnpm typecheck`.
- Use existing CSS variables from `tokens.css` — no new hardcoded hex colors.
- Headless UI: packages emit BEM class names only, zero CSS bundled in non-theme packages.
- Follow existing `defineComponent` + `h()` pattern — no SFCs.

---

### Task 1: Add Z-index CSS Variables to Token Files

**Files:**
- Modify: `packages/themes/src/antd/tokens.css`
- Modify: `packages/themes/src/material/tokens.css`

**Interfaces:**
- Produces: CSS custom properties `--dc-z-node`, `--dc-z-mask`, `--dc-z-toolbar`, `--dc-z-toolbar-float`, `--dc-z-drag-preview` available to all theme consumers.

- [ ] **Step 1: Add z-index variables to antd tokens**

Open `packages/themes/src/antd/tokens.css`. Add a new `/* Z-index */` section at the end of the `:root` block, before the closing `}`:

```css
  /* ── Z-index ────────────────────────────── */
  --dc-z-node: 1;
  --dc-z-mask: 2;
  --dc-z-toolbar: 10;
  --dc-z-toolbar-float: 1000;
  --dc-z-drag-preview: 9999;
```

- [ ] **Step 2: Add z-index variables to material tokens**

Open `packages/themes/src/material/tokens.css`. Add the same section at the end of the `:root` block:

```css
  /* ── Z-index ────────────────────────────── */
  --dc-z-node: 1;
  --dc-z-mask: 2;
  --dc-z-toolbar: 10;
  --dc-z-toolbar-float: 1000;
  --dc-z-drag-preview: 9999;
```

- [ ] **Step 3: Build to verify**

Run: `pnpm build`
Expected: PASS (CSS-only changes, no TypeScript impact)

- [ ] **Step 4: Commit**

```bash
git add packages/themes/src/antd/tokens.css packages/themes/src/material/tokens.css
git commit -m "feat(themes): add z-index CSS variables for layering standardization"
```

---

### Task 2: Replace Hardcoded Z-index in widgets.css

**Files:**
- Modify: `packages/themes/src/components/widgets.css`

**Interfaces:**
- Consumes: `--dc-z-toolbar`, `--dc-z-toolbar-float` from Task 1.
- Produces: Toolbar z-index now driven by CSS variables.

- [ ] **Step 1: Replace hardcoded z-index values**

Open `packages/themes/src/components/widgets.css`. Make these changes:

Find:
```css
.dc-node__toolbar {
  position: absolute;
  top: 0;
  right: -36px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}
```

Replace with:
```css
.dc-node__toolbar {
  position: absolute;
  top: 0;
  right: -36px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: var(--dc-z-toolbar);
}
```

Find:
```css
.dc-node__toolbar--floating {
  right: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  border-radius: var(--dc-radius);
  background: var(--dc-bg);
  padding: 2px;
  pointer-events: auto;
}
```

Replace with:
```css
.dc-node__toolbar--floating {
  right: auto;
  z-index: var(--dc-z-toolbar-float);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  border-radius: var(--dc-radius);
  background: var(--dc-bg);
  padding: 2px;
  pointer-events: auto;
}
```

- [ ] **Step 2: Build to verify**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/themes/src/components/widgets.css
git commit -m "refactor(themes): use z-index CSS variables for toolbar layering"
```

---

### Task 3: Rewrite DefaultDropIndicator as Slot Placeholder

**Files:**
- Modify: `packages/renderer/src/components/DefaultDropIndicator.ts`
- Modify: `packages/themes/src/components/canvas.css`

**Interfaces:**
- Consumes: CSS variables `--dc-primary-bg-hover`, `--dc-primary`, `--dc-radius-lg` from tokens.
- Produces: Same component name `DcDefaultDropIndicator`, same zero-props interface. The visual output changes from a 2px line to a 48px dashed-border rectangle.

- [ ] **Step 1: Rewrite DefaultDropIndicator component**

Open `packages/renderer/src/components/DefaultDropIndicator.ts`. Replace the entire file content:

```typescript
import { defineComponent, h } from 'vue'

/**
 * Slot-style drop indicator shown during drag-over.
 * Renders a dashed-border rectangle placeholder indicating where
 * the widget will be placed. Styled via CSS class `dc-drop-indicator`.
 */
export default defineComponent({
  name: 'DcDefaultDropIndicator',

  setup() {
    return () =>
      h('div', { class: 'dc-drop-indicator' })
  },
})
```

- [ ] **Step 2: Replace drop indicator CSS**

Open `packages/themes/src/components/canvas.css`. Find and replace the drop indicator section:

Find:
```css
/* ── Drop Indicator ──────────────────────── */

.dc-drop-indicator {
  padding: 4px 0;
  pointer-events: none;
}

.dc-drop-indicator__line {
  height: 2px;
  background: var(--dc-primary);
  border-radius: 1px;
}
```

Replace with:
```css
/* ── Drop Indicator (slot placeholder) ──── */

.dc-drop-indicator {
  min-height: 48px;
  background: var(--dc-primary-bg-hover);
  border: 2px dashed var(--dc-primary);
  border-radius: var(--dc-radius-lg);
  margin: 4px 0;
  pointer-events: none;
  animation: dc-fade-in 0.15s ease;
}

@keyframes dc-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 3: Build and typecheck**

Run: `pnpm build && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Run existing tests**

Run: `pnpm -r run test`
Expected: All tests pass (drop indicator has no unit tests, but this verifies no regressions)

- [ ] **Step 5: Commit**

```bash
git add packages/renderer/src/components/DefaultDropIndicator.ts packages/themes/src/components/canvas.css
git commit -m "feat(renderer): replace drop indicator line with slot-style placeholder"
```

---

### Task 4: Hide Toolbar During Drag

**Files:**
- Modify: `packages/renderer/src/components/WidgetRenderer.ts:94-105`

**Interfaces:**
- Consumes: `engine.store.dragTarget` (existing `Ref<{ sourceNodeId: string | null, widgetType: string | null } | null>`).
- Produces: Toolbar rendering now gated on `!isBeingDragged`.

- [ ] **Step 1: Add isBeingDragged guard to WidgetRenderer**

Open `packages/renderer/src/components/WidgetRenderer.ts`. In the `setup` function's render, find the toolbar rendering block (lines 94-105):

```typescript
      // TOOLBAR (when selected): action-driven floating toolbar
      // Teleported to <body> to escape all ancestor overflow clipping.
      if (widget.state.isSelected.value && toolbarPosition.value.visible) {
```

Replace with:

```typescript
      // TOOLBAR (when selected): action-driven floating toolbar
      // Teleported to <body> to escape all ancestor overflow clipping.
      // Hide toolbar when this node is being dragged.
      const isBeingDragged = ctx.engine.store.dragTarget.value?.sourceNodeId === node.id
      if (widget.state.isSelected.value && toolbarPosition.value.visible && !isBeingDragged) {
```

- [ ] **Step 2: Build and typecheck**

Run: `pnpm build && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/renderer/src/components/WidgetRenderer.ts
git commit -m "fix(renderer): hide toolbar when node is being dragged"
```

---

### Task 5: Add maxRight Option to useToolbarPosition

**Files:**
- Modify: `packages/renderer/src/composables/useToolbarPosition.ts`
- Modify: `packages/renderer/src/composables/useToolbarPosition.test.ts`

**Interfaces:**
- Consumes: Existing `UseToolbarPositionOptions`.
- Produces: Extended `UseToolbarPositionOptions` with optional `maxRight: number`. When set, toolbar flips to left side if `left + toolbarWidth > maxRight`.

- [ ] **Step 1: Add maxRight to options interface**

Open `packages/renderer/src/composables/useToolbarPosition.ts`. Find the `UseToolbarPositionOptions` interface:

```typescript
export interface UseToolbarPositionOptions {
  /** Horizontal gap (px) between widget right edge and toolbar left edge. Default: 8 */
  gap?: number
  /** Approximate toolbar width (px), used for viewport edge clamping. Default: 32 */
  toolbarWidth?: number
}
```

Add the new option:

```typescript
export interface UseToolbarPositionOptions {
  /** Horizontal gap (px) between widget right edge and toolbar left edge. Default: 8 */
  gap?: number
  /** Approximate toolbar width (px), used for viewport edge clamping. Default: 32 */
  toolbarWidth?: number
  /** Reactive max right boundary (px, viewport-relative). When set, toolbar flips to left if it would exceed this. */
  maxRight?: Ref<number | undefined>
}
```

- [ ] **Step 2: Destructure maxRight in the composable**

Find the options destructuring line:

```typescript
  const { gap = 8, toolbarWidth = 32 } = options
```

Replace with:

```typescript
  const { gap = 8, toolbarWidth = 32, maxRight } = options
```

- [ ] **Step 3: Use maxRight in the flip logic**

Find the flip condition in the `update` function:

```typescript
    // If toolbar would go off the right edge of clip area, flip to left side
    if (left + toolbarWidth > clip.right) {
      left = rect.left - gap - toolbarWidth
    }
```

Replace with:

```typescript
    // If toolbar would go off the right edge of clip area or exceed maxRight, flip to left side
    const boundary = maxRight?.value
    const effectiveRight = boundary != null ? Math.min(clip.right, boundary) : clip.right
    if (left + toolbarWidth > effectiveRight) {
      left = rect.left - gap - toolbarWidth
    }
```

- [ ] **Step 4: Add test for maxRight**

Open `packages/renderer/src/composables/useToolbarPosition.test.ts`. Add a new test after the existing "flips to left side when element is near right edge" test:

```typescript
  it('flips to left side when maxRight is exceeded', async () => {
    const el = mockElement({ top: 100, left: 600, right: 700, bottom: 200 })
    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    // maxRight constrains the toolbar to stay within 650px from left
    const { position, update } = useToolbarPosition(elRef, active, { gap: 8, toolbarWidth: 32, maxRight: ref(650) })

    await nextTick()
    update()

    expect(position.value.visible).toBe(true)
    // left(700) + gap(8) + toolbarWidth(32) = 740 > maxRight(650), so flip
    // flipped: rect.left(600) - gap(8) - toolbarWidth(32) = 560
    expect(position.value.left).toBe(560)
  })

  it('does not flip when maxRight is not exceeded', async () => {
    const el = mockElement({ top: 100, left: 100, right: 200, bottom: 200 })
    const elRef = ref<HTMLElement | null>(el)
    const active = ref(true)

    const { position, update } = useToolbarPosition(elRef, active, { gap: 8, toolbarWidth: 32, maxRight: ref(900) })

    await nextTick()
    update()

    expect(position.value.visible).toBe(true)
    // left(200) + gap(8) + toolbarWidth(32) = 240 < maxRight(900), no flip
    expect(position.value.left).toBe(208)
  })
```

- [ ] **Step 5: Run tests**

Run: `pnpm -r run test`
Expected: All tests pass including the new maxRight tests.

- [ ] **Step 6: Build and typecheck**

Run: `pnpm build && pnpm typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/renderer/src/composables/useToolbarPosition.ts packages/renderer/src/composables/useToolbarPosition.test.ts
git commit -m "feat(renderer): add maxRight option to useToolbarPosition"
```

---

### Task 6: Wire maxRight from Canvas to WidgetRenderer

**Files:**
- Modify: `packages/designer/src/components/DcCanvas.ts`
- Modify: `packages/renderer/src/types.ts`
- Modify: `packages/renderer/src/components/WidgetRenderer.ts`

**Interfaces:**
- Consumes: `maxRight` option from Task 5.
- Produces: `RendererContext` extended with optional `toolbarMaxRight: Ref<number | undefined>`. `DcCanvas` provides it by reading the property panel's left boundary.

- [ ] **Step 1: Add toolbarMaxRight to RendererContext**

Open `packages/renderer/src/types.ts`. Find the `RendererContext` interface:

```typescript
export interface RendererContext {
  engine: DesignerEngine
  componentMap: ComponentMap
  extensions: RendererExtensions
  eventHooks: RendererEventHooks
  actionRegistry: NodeActionRegistry
  dragOverNodeId: Ref<string | null>
}
```

Add the new field:

```typescript
export interface RendererContext {
  engine: DesignerEngine
  componentMap: ComponentMap
  extensions: RendererExtensions
  eventHooks: RendererEventHooks
  actionRegistry: NodeActionRegistry
  dragOverNodeId: Ref<string | null>
  /** Optional max right boundary for toolbar positioning (viewport px). */
  toolbarMaxRight?: Ref<number | undefined>
}
```

- [ ] **Step 2: Add toolbarMaxRight to RendererOptions**

Find the `RendererOptions` interface in the same file and add:

```typescript
  /**
   * Optional max right boundary for toolbar positioning (viewport px).
   * Prevents toolbar from overlapping with the property panel.
   */
  toolbarMaxRight?: Ref<number | undefined>
```

- [ ] **Step 3: Thread toolbarMaxRight through RootRenderer**

Open `packages/renderer/src/components/RootRenderer.ts`. Find the `createRendererContext` call in setup:

```typescript
    const ctx = createRendererContext({
      engine: props.engine,
      componentMap: props.componentMap,
      extensions: props.extensions,
      eventHooks: props.eventHooks,
      actionRegistry: props.actionRegistry,
      dragOverNodeId: props.dragOverNodeId,
    })
```

Add the new field:

```typescript
    const ctx = createRendererContext({
      engine: props.engine,
      componentMap: props.componentMap,
      extensions: props.extensions,
      eventHooks: props.eventHooks,
      actionRegistry: props.actionRegistry,
      dragOverNodeId: props.dragOverNodeId,
      toolbarMaxRight: props.toolbarMaxRight,
    })
```

Also add the prop to RootRenderer's props definition. Find:

```typescript
    dragOverIndex: {
      type: Object as PropType<Ref<number | null>>,
      default: undefined,
    },
```

Add after it:

```typescript
    toolbarMaxRight: {
      type: Object as PropType<Ref<number | undefined>>,
      default: undefined,
    },
```

- [ ] **Step 4: Read toolbarMaxRight in WidgetRenderer and pass to useToolbarPosition**

Open `packages/renderer/src/components/WidgetRenderer.ts`. Find the `useToolbarPosition` call:

```typescript
    const { position: toolbarPosition } = useToolbarPosition(nodeElRef, widget.state.isSelected)
```

Replace with:

```typescript
    const { position: toolbarPosition } = useToolbarPosition(nodeElRef, widget.state.isSelected, {
      maxRight: ctx.toolbarMaxRight,
    })
```

- [ ] **Step 5: Provide toolbarMaxRight from DcCanvas**

Open `packages/designer/src/components/DcCanvas.ts`. Add a computed ref for the property panel's left boundary and pass it to RootRenderer.

The current render function returns:

```typescript
    return () => h(
      'div',
      {
        class: 'dc-canvas',
        onDragover: handleCanvasDragOver,
        onDragleave: handleCanvasDragLeave,
        onDrop: handleCanvasDrop,
        onClick: handleClick,
      },
      [
        h(DcToolbar),
        h('div', { class: 'dc-canvas__content' }, [
          h(RootRenderer, {
            engine,
            componentMap,
            extensions: rendererExtensions.value,
            eventHooks,
            actionRegistry,
            dragOverNodeId,
            dragOverIndex,
          }),
        ]),
      ],
    )
```

Replace with:

```typescript
    // Compute right boundary for toolbar: property panel's left edge
    const toolbarMaxRight = computed(() => {
      const canvas = document.querySelector('.dc-designer__panel--right') as HTMLElement | null
      return canvas?.getBoundingClientRect().left
    })

    return () => h(
      'div',
      {
        class: 'dc-canvas',
        onDragover: handleCanvasDragOver,
        onDragleave: handleCanvasDragLeave,
        onDrop: handleCanvasDrop,
        onClick: handleClick,
      },
      [
        h(DcToolbar),
        h('div', { class: 'dc-canvas__content' }, [
          h(RootRenderer, {
            engine,
            componentMap,
            extensions: rendererExtensions.value,
            eventHooks,
            actionRegistry,
            dragOverNodeId,
            dragOverIndex,
            toolbarMaxRight,
          }),
        ]),
      ],
    )
```

Also add `computed` to the import from `vue`:

```typescript
import { computed, defineComponent, h } from 'vue'
```

- [ ] **Step 6: Update createRendererContext to accept toolbarMaxRight**

Open `packages/renderer/src/context.ts`. Find the `createRendererContext` function:

```typescript
export function createRendererContext(options: RendererOptions): RendererContext {
  return {
    engine: options.engine,
    componentMap: options.componentMap,
    extensions: options.extensions ?? {},
    eventHooks: options.eventHooks ?? createDefaultEventHooks(),
    actionRegistry: options.actionRegistry ?? createNodeActionRegistry(),
    dragOverNodeId: options.dragOverNodeId ?? ref(null),
  }
}
```

Add the `toolbarMaxRight` field:

```typescript
export function createRendererContext(options: RendererOptions): RendererContext {
  return {
    engine: options.engine,
    componentMap: options.componentMap,
    extensions: options.extensions ?? {},
    eventHooks: options.eventHooks ?? createDefaultEventHooks(),
    actionRegistry: options.actionRegistry ?? createNodeActionRegistry(),
    dragOverNodeId: options.dragOverNodeId ?? ref(null),
    toolbarMaxRight: options.toolbarMaxRight,
  }
}
```

- [ ] **Step 7: Build, typecheck, and run tests**

Run: `pnpm build && pnpm typecheck && pnpm -r run test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/renderer/src/types.ts packages/renderer/src/components/RootRenderer.ts packages/renderer/src/components/WidgetRenderer.ts packages/renderer/src/context.ts packages/designer/src/components/DcCanvas.ts
git commit -m "feat: wire toolbar maxRight boundary from canvas to renderer"
```

---

### Task 7: Add Floating Drag Preview to useDragDrop

**Files:**
- Modify: `packages/designer/src/composables/useDragDrop.ts`
- Modify: `packages/designer/src/types.ts`

**Interfaces:**
- Consumes: `WidgetMeta` from `@dragcraft/core`, `engine.store.dragTarget`.
- Produces: `UseDragDropReturn` extended with `createDragPreview`, `updateDragPreviewPosition`, `destroyDragPreview`. `DesignerContext` extended with same.

- [ ] **Step 1: Add preview functions to UseDragDropReturn**

Open `packages/designer/src/composables/useDragDrop.ts`. Find the `UseDragDropReturn` interface:

```typescript
export interface UseDragDropReturn {
  dragOverNodeId: Ref<string | null>
  dragOverIndex: Ref<number | null>
  lockedIndices: ComputedRef<ReadonlySet<number>>
  validDropIndices: ComputedRef<ReadonlySet<number> | null>
  handleMaterialDragStart: (e: DragEvent, meta: WidgetMeta) => void
  handleNodeDragStart: (e: DragEvent, nodeId: string) => void
  handleCanvasDragOver: (e: DragEvent) => void
  handleCanvasDragLeave: (e: DragEvent) => void
  handleCanvasDrop: (e: DragEvent) => void
  handleDragEnd: (e: DragEvent) => void
}
```

Add the new fields:

```typescript
export interface UseDragDropReturn {
  dragOverNodeId: Ref<string | null>
  dragOverIndex: Ref<number | null>
  lockedIndices: ComputedRef<ReadonlySet<number>>
  validDropIndices: ComputedRef<ReadonlySet<number> | null>
  handleMaterialDragStart: (e: DragEvent, meta: WidgetMeta) => void
  handleNodeDragStart: (e: DragEvent, nodeId: string) => void
  handleCanvasDragOver: (e: DragEvent) => void
  handleCanvasDragLeave: (e: DragEvent) => void
  handleCanvasDrop: (e: DragEvent) => void
  handleDragEnd: (e: DragEvent) => void
  /** Create a floating preview element at the mouse position */
  createDragPreview: (meta: WidgetMeta, isMove: boolean) => void
  /** Update the floating preview position to follow the mouse */
  updateDragPreviewPosition: (e: DragEvent) => void
  /** Remove the floating preview element */
  destroyDragPreview: () => void
}
```

- [ ] **Step 2: Implement preview functions in useDragDrop**

Inside the `useDragDrop` function body, add the preview management code before the `return` statement:

```typescript
  // ── Drag preview management ──

  let dragPreviewEl: HTMLElement | null = null

  function createDragPreview(meta: WidgetMeta, isMove: boolean): void {
    destroyDragPreview()
    const el = document.createElement('div')
    el.className = 'dc-drag-preview' + (isMove ? ' dc-drag-preview--move' : '')
    if (meta.icon) {
      const iconSpan = document.createElement('span')
      iconSpan.className = 'dc-drag-preview__icon'
      if (typeof meta.icon === 'string') {
        iconSpan.textContent = meta.icon
      }
      else {
        iconSpan.appendChild(meta.icon as unknown as Node)
      }
      el.appendChild(iconSpan)
    }
    const nameSpan = document.createElement('span')
    nameSpan.className = 'dc-drag-preview__name'
    nameSpan.textContent = meta.title
    el.appendChild(nameSpan)
    document.body.appendChild(el)
    dragPreviewEl = el
  }

  function updateDragPreviewPosition(e: DragEvent): void {
    if (dragPreviewEl) {
      dragPreviewEl.style.left = `${e.clientX + 12}px`
      dragPreviewEl.style.top = `${e.clientY + 12}px`
    }
  }

  function destroyDragPreview(): void {
    if (dragPreviewEl) {
      dragPreviewEl.remove()
      dragPreviewEl = null
    }
  }
```

- [ ] **Step 3: Wire preview into handleCanvasDragOver**

Find `handleCanvasDragOver` and add the position update call at the end of the function:

```typescript
  function handleCanvasDragOver(e: DragEvent): void {
    e.preventDefault()
    // Flat model: always drop into root
    dragOverNodeId.value = 'root'
    if (e.dataTransfer) {
      const dragTarget = engine.store.dragTarget.value
      e.dataTransfer.dropEffect = dragTarget?.sourceNodeId ? 'move' : 'copy'
    }

    const rawIndex = computeDropIndex(e)
    const valid = validDropIndices.value

    if (valid && valid.size > 0) {
      dragOverIndex.value = valid.has(rawIndex)
        ? rawIndex
        : findNearestValidIndex(rawIndex, valid)
    }
    else if (valid && valid.size === 0) {
      dragOverIndex.value = null
    }
    else {
      dragOverIndex.value = rawIndex
    }

    updateDragPreviewPosition(e)
  }
```

- [ ] **Step 4: Wire preview destroy into handleCanvasDrop and handleDragEnd**

In `handleCanvasDrop`, add `destroyDragPreview()` at the start of the function (before `e.preventDefault()`):

```typescript
  function handleCanvasDrop(e: DragEvent): void {
    destroyDragPreview()
    e.preventDefault()
    // ... rest unchanged
  }
```

In `handleDragEnd`, add `destroyDragPreview()`:

```typescript
  function handleDragEnd(_e: DragEvent): void {
    destroyDragPreview()
    dragOverNodeId.value = null
    dragOverIndex.value = null
    engine.store.setDragTarget(null)
  }
```

- [ ] **Step 5: Wire preview into handleMaterialDragStart**

Find `handleMaterialDragStart` and add `createDragPreview` call:

```typescript
  function handleMaterialDragStart(e: DragEvent, meta: WidgetMeta): void {
    engine.store.setDragTarget({
      sourceNodeId: null,
      widgetType: meta.type,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', meta.type)
    }
    createDragPreview(meta, false)
  }
```

- [ ] **Step 6: Wire preview into handleNodeDragStart**

Find `handleNodeDragStart` and add `createDragPreview` call. Since node drag needs the meta, look it up from the registry:

```typescript
  function handleNodeDragStart(e: DragEvent, nodeId: string): void {
    engine.store.setDragTarget({
      sourceNodeId: nodeId,
      widgetType: null,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', nodeId)
    }
    // Create preview for the moved node
    const children = engine.store.getRawSchema().root.children ?? []
    const node = children.find(c => c.id === nodeId)
    if (node) {
      const meta = engine.registry.getWidget(node.type)
      if (meta) {
        createDragPreview(meta, true)
      }
    }
  }
```

- [ ] **Step 7: Add preview functions to the return value**

In the `return` statement of `useDragDrop`, add the three new functions:

```typescript
  return {
    dragOverNodeId,
    dragOverIndex,
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

- [ ] **Step 8: Update DesignerContext type**

Open `packages/designer/src/types.ts`. Find the `DesignerContext` interface and add the three new functions:

```typescript
export interface DesignerContext {
  engine: DesignerEngine
  componentMap: ComponentMap
  widgetGroups: WidgetGroupConfig[] | undefined
  extensions: DesignerExtensions
  fieldComponentMap: FieldComponentMap | undefined
  globalConfigSchema: FormSchema | null
  eventHooks: RendererEventHooks
  actionRegistry: NodeActionRegistry
  dragOverNodeId: Ref<string | null>
  dragOverIndex: Ref<number | null>
  handleCanvasDragOver: (e: DragEvent) => void
  handleCanvasDragLeave: (e: DragEvent) => void
  handleCanvasDrop: (e: DragEvent) => void
  createDragPreview: (meta: WidgetMeta, isMove: boolean) => void
  updateDragPreviewPosition: (e: DragEvent) => void
  destroyDragPreview: () => void
  searchQuery: Ref<string>
  activeTab: Ref<PropertyTabKey>
}
```

Note: Add `WidgetMeta` to the import from `@dragcraft/core` at the top of the file if not already imported.

- [ ] **Step 9: Wire preview functions into DcDesigner context**

Open `packages/designer/src/components/DcDesigner.ts`. Find the context object construction and add the three new fields:

```typescript
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

- [ ] **Step 10: Build and typecheck**

Run: `pnpm build && pnpm typecheck`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add packages/designer/src/composables/useDragDrop.ts packages/designer/src/types.ts packages/designer/src/components/DcDesigner.ts
git commit -m "feat(designer): add floating drag preview layer to useDragDrop"
```

---

### Task 8: Hide Browser Ghost in useNodeDrag

**Files:**
- Modify: `packages/renderer/src/composables/useNodeDrag.ts`

**Interfaces:**
- Consumes: `DragEvent` from browser.
- Produces: Browser's default drag ghost suppressed via `setDragImage` with a 1x1 transparent canvas.

- [ ] **Step 1: Add setDragImage call to handleDragStart**

Open `packages/renderer/src/composables/useNodeDrag.ts`. Find the `handleDragStart` function. After the `e.dataTransfer.setData('text/plain', nodeId)` line, add:

```typescript
    // Hide browser's default drag ghost (replaced by floating preview in useDragDrop)
    if (e.dataTransfer) {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      e.dataTransfer.setDragImage(canvas, 0, 0)
    }
```

The full `handleDragStart` should now be:

```typescript
  const handleDragStart = (e: DragEvent) => {
    e.stopPropagation()
    const nodeId = getNode().id

    // Fire interceptable hook
    if (eventHooks.onBeforeDrag) {
      const result = eventHooks.onBeforeDrag({ nodeId, event: e })
      if (result === false) {
        e.preventDefault()
        return
      }
    }

    engine.store.setDragTarget({
      sourceNodeId: nodeId,
      widgetType: null,
    })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', nodeId)
      // Hide browser's default drag ghost (replaced by floating preview in useDragDrop)
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      e.dataTransfer.setDragImage(canvas, 0, 0)
    }
  }
```

- [ ] **Step 2: Build and typecheck**

Run: `pnpm build && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/renderer/src/composables/useNodeDrag.ts
git commit -m "fix(renderer): hide browser drag ghost in useNodeDrag"
```

---

### Task 9: Hide Browser Ghost in DcMaterialItem and Wire Preview

**Files:**
- Modify: `packages/designer/src/components/DcMaterialItem.ts`

**Interfaces:**
- Consumes: `createDragPreview`, `updateDragPreviewPosition`, `destroyDragPreview` from `DesignerContext` (Task 7).
- Produces: Material items show custom preview instead of browser ghost, and dim during drag.

- [ ] **Step 1: Wire preview into DcMaterialItem**

Open `packages/designer/src/components/DcMaterialItem.ts`. In the `setup` function, destructure the preview functions from context:

Find:
```typescript
    const { engine, extensions } = ctx
```

Replace with:
```typescript
    const { engine, extensions, createDragPreview } = ctx
```

- [ ] **Step 2: Update handleDragStart to hide ghost and create preview**

Find the `handleDragStart` function:

```typescript
    const handleDragStart = (e: DragEvent) => {
      if (!isCreatable.value) {
        e.preventDefault()
        return
      }
      engine.store.setDragTarget({
        sourceNodeId: null,
        widgetType: props.meta.type,
      })
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('text/plain', props.meta.type)
      }
    }
```

Replace with:

```typescript
    const handleDragStart = (e: DragEvent) => {
      if (!isCreatable.value) {
        e.preventDefault()
        return
      }
      engine.store.setDragTarget({
        sourceNodeId: null,
        widgetType: props.meta.type,
      })
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('text/plain', props.meta.type)
        // Hide browser's default drag ghost (replaced by floating preview)
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        e.dataTransfer.setDragImage(canvas, 0, 0)
      }
      createDragPreview(props.meta, false)
    }
```

- [ ] **Step 3: Build and typecheck**

Run: `pnpm build && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/designer/src/components/DcMaterialItem.ts
git commit -m "feat(designer): hide browser ghost and show custom preview on material drag"
```

---

### Task 10: Add Drag State CSS Classes

**Files:**
- Modify: `packages/themes/src/components/canvas.css`
- Modify: `packages/themes/src/components/material-panel.css`
- Modify: `packages/designer/src/components/DcCanvas.ts`
- Modify: `packages/designer/src/components/DcMaterialItem.ts`

**Interfaces:**
- Produces: `.dc-canvas--dragging` class on canvas during drag, `.dc-material-item--dragging` on source item during drag.

- [ ] **Step 1: Add dragging class to DcCanvas**

Open `packages/designer/src/components/DcCanvas.ts`. In the `setup` function, add a computed for the dragging state and use it in the class binding.

Find the return statement:

```typescript
    return () => h(
      'div',
      {
        class: 'dc-canvas',
        onDragover: handleCanvasDragOver,
```

Replace with:

```typescript
    const isDragging = computed(() => engine.store.dragTarget.value !== null)

    return () => h(
      'div',
      {
        class: ['dc-canvas', { 'dc-canvas--dragging': isDragging.value }],
        onDragover: handleCanvasDragOver,
```

Ensure `computed` is imported from `vue` (it should already be there from Task 6).

- [ ] **Step 2: Add dragging class to DcMaterialItem**

Open `packages/designer/src/components/DcMaterialItem.ts`. The material item needs a reactive `isDragging` state. Since the `dragend` event fires when the drag ends, we can use a local ref.

Add a `ref` import and a dragging state:

Find:
```typescript
import { computed, defineComponent, h } from 'vue'
```

Replace with:
```typescript
import { computed, defineComponent, h, ref } from 'vue'
```

In the setup function, add a local ref for dragging state:

```typescript
    const isDragging = ref(false)
```

Update `handleDragStart` to set `isDragging.value = true` at the end:

```typescript
    const handleDragStart = (e: DragEvent) => {
      if (!isCreatable.value) {
        e.preventDefault()
        return
      }
      // ... existing code ...
      createDragPreview(props.meta, false)
      isDragging.value = true
    }
```

Update `handleDragEnd` to reset:

```typescript
    const handleDragEnd = () => {
      isDragging.value = false
      engine.store.setDragTarget(null)
    }
```

In the render function, add the dragging class to the default renderer path. Find:

```typescript
      return h(
        'div',
        {
          class: [
            'dc-material-item',
            { 'dc-material-item--disabled': !creatable },
          ],
```

Replace with:

```typescript
      return h(
        'div',
        {
          class: [
            'dc-material-item',
            {
              'dc-material-item--disabled': !creatable,
              'dc-material-item--dragging': isDragging.value,
            },
          ],
```

- [ ] **Step 3: Add CSS for dragging states**

Open `packages/themes/src/components/canvas.css`. Add at the end of the file:

```css
/* ── Canvas Dragging State ──────────────── */

.dc-canvas--dragging {
  /* Reserved for future drag-in-progress visual hooks */
}
```

Open `packages/themes/src/components/material-panel.css`. Add at the end of the file:

```css
/* ── Material Item Dragging State ───────── */

.dc-material-item--dragging {
  opacity: 0.5;
}
```

- [ ] **Step 4: Build, typecheck, and lint**

Run: `pnpm build && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/components/DcCanvas.ts packages/designer/src/components/DcMaterialItem.ts packages/themes/src/components/canvas.css packages/themes/src/components/material-panel.css
git commit -m "feat: add drag state CSS classes for canvas and material items"
```

---

### Task 11: Add Drag Preview CSS

**Files:**
- Modify: `packages/themes/src/components/canvas.css`

**Interfaces:**
- Produces: `.dc-drag-preview` and `.dc-drag-preview--move` CSS classes used by the preview layer created in Task 7.

- [ ] **Step 1: Add drag preview CSS**

Open `packages/themes/src/components/canvas.css`. Add at the end of the file:

```css
/* ── Drag Preview (floating) ────────────── */

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

.dc-drag-preview__icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.dc-drag-preview__name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/themes/src/components/canvas.css
git commit -m "feat(themes): add drag preview floating card styles"
```

---

### Task 12: Final Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build, typecheck, and lint**

Run: `pnpm build && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 2: Run all tests**

Run: `pnpm -r run test`
Expected: All tests pass

- [ ] **Step 3: Manual smoke test in playground**

Run: `pnpm --filter playground dev`
Expected: Dev server starts. Open browser and verify:
1. Drag a widget from material panel — custom preview card follows mouse, browser ghost is hidden
2. Drop indicator is a dashed-border rectangle, not a 2px line
3. Drag an existing widget via toolbar handle — toolbar hides, preview shows with blue border
4. Toolbar does not overlap with property panel when widget is near the right edge
5. Material item dims during drag
