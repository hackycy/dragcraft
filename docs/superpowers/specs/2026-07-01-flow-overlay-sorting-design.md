# Flow Overlay Sorting Design

**Date:** 2026-07-01
**Status:** Draft

## Problem

The current `flow: false` implementation renders non-flow nodes in a separate `dc-canvas__overlay` container with index-space mapping between flow and array indices. This adds complexity (overlay DOM layer, `flowIndexToArrayIndex`/`arrayIndexToFlowIndex` helpers, dual index spaces) and prevents non-flow nodes from being sorted at all.

The user wants a simpler design: same-layer rendering with CSS positioning, where non-flow nodes can participate in unified sorting.

## Design

Revert the overlay layer separation. All nodes render in one DOM container. `flow: false` nodes use CSS `position: sticky` to visually escape the flow while remaining in the same sortable list.

### Core Principle

**Array position = z-order. CSS = visual position.** Non-flow nodes can be dragged to any array position (changing z-order relative to other non-flow nodes), but their visual position is always determined by CSS.

### Rendering Changes

**File:** `packages/renderer/src/components/RootRenderer.ts`

Revert to single-container rendering. Remove the flow/overlay split. All `root.children` map to `WidgetRenderer` VNodes in one list.

```ts
return () => {
  const schema = props.engine.store.schema.value
  const rootChildren = schema.root.children ?? []
  const isDragOver = props.dragOverNodeId?.value === 'root'

  const DropIndicator = props.extensions?.dropIndicator ?? DefaultDropIndicator
  const EmptyState = props.extensions?.emptyState ?? DefaultEmptyState

  const childVNodes: VNode[] = rootChildren.map(child =>
    h(WidgetRenderer, { key: child.id, node: child }),
  )

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

  const isEmpty = rootChildren.length === 0 && !isDragOver

  return h('div', { 'class': 'dc-root-renderer', 'data-node-id': 'root', 'data-node-type': 'root' }, [
    h(ContainerShell.value, { class: { 'dc-container-shell--empty': isEmpty } }, {
      default: () => isEmpty
        ? [h(EmptyState, { isDragOver: false })]
        : childVNodes,
    }),
  ])
}
```

### Drag-Drop Changes

**File:** `packages/designer/src/composables/useDragDrop.ts`

1. **Remove** `flowIndexToArrayIndex` and `arrayIndexToFlowIndex` helper functions.
2. **Revert** `computeDropIndex` to query all `[data-node-id]` elements (not just `.dc-canvas__flow`).
3. **Revert** `handleCanvasDrop` to use `visualIndex` directly for `ADD_NODE` and `MOVE_NODE` — no index conversion needed.
4. **Revert** `handleCanvasDragOver` to compare `rawIndex` directly with `validDropIndices` — no index space conversion.
5. **Keep** the `handleNodeDragStart` guard that blocks drag for non-flow nodes — **remove** this guard since non-flow nodes should now be draggable.

### Sortable System Changes

**File:** `packages/core/src/sortable.ts`

No changes needed. `getLockedIndices` already skips `flow: false` nodes, which means:
- Non-flow nodes are never in `lockedIndices`
- Non-flow nodes can be inserted/moved/removed freely
- Non-flow nodes don't block operations on flow nodes

### Action Registry Changes

**File:** `packages/renderer/src/action-registry.ts`

Update the `available` checks for drag-handle, move-up, and move-down actions. For `flow: false` nodes, only check `draggable` (skip `sortable` check). For `flow: true` nodes, keep existing behavior.

```ts
// Drag handle
available: (ctx) => {
  const instanceCtx = toInstanceCtx(ctx)
  if (ctx.meta?.flow === false)
    return resolveBehavior(ctx.meta?.draggable, instanceCtx, true)
  return resolveBehavior(ctx.meta?.draggable, instanceCtx)
    && resolveBehavior(ctx.meta?.sortable, instanceCtx)
},
```

Same pattern for move-up and move-down.

### useWidgetNode Changes

**File:** `packages/renderer/src/composables/useWidgetNode.ts`

1. **Revert** `draggable` computed — remove the `flow: false → draggable: false` guard. Non-flow nodes should be draggable.

```ts
const draggable = computed(() => {
  // sortable: false implies not draggable (only for flow nodes)
  if (meta.value?.flow !== false && !sortable.value)
    return false
  const field = meta.value?.draggable
  if (typeof field !== 'function')
    return field !== false
  return field(readInstanceCtx())
})
```

2. **Update** `wrapperClasses` — non-flow nodes should not have `dc-node--locked` class (they are draggable).

```ts
const wrapperClasses = computed<Array<string | Record<string, boolean>>>(() => [
  'dc-node',
  'dc-node--widget',
  {
    'dc-node--masked': useMask.value,
    'dc-node--unmasked': !useMask.value,
    'dc-node--non-selectable': !selectable.value,
    'dc-node--locked': meta.value?.flow !== false && !sortable.value,
    'dc-node--out-of-flow': meta.value?.flow === false,
  },
  state.interactionClasses.value,
])
```

### CSS Changes

**File:** `packages/themes/src/components/canvas.css`

- **Remove** `.dc-canvas__overlay` styles (no longer needed)
- **Keep** `.dc-node--out-of-flow { cursor: default; }` — or change to `cursor: grab` since non-flow nodes are now draggable

### TabBar Widget

**File:** `playground/src/widgets/TabBarWidget.ts`

No changes needed. `flow: false` remains as-is.

## Impact Summary

| Component | Current | After |
|-----------|---------|-------|
| RootRenderer | Splits flow/overlay layers | Single container, all nodes together |
| useDragDrop | Index space conversion helpers | Direct visual index, no conversion |
| useWidgetNode | `flow: false` → `draggable: false` | `flow: false` nodes are draggable |
| action-registry | Drag/move hidden for `flow: false` | Drag/move available for `flow: false` |
| sortable.ts | Skips `flow: false` in locked indices | Unchanged |
| CSS | `.dc-canvas__overlay` positioning | Removed, `.dc-node--out-of-flow` cursor only |

## Files Changed

| File | Change |
|------|--------|
| `packages/renderer/src/components/RootRenderer.ts` | Revert to single-container rendering |
| `packages/designer/src/composables/useDragDrop.ts` | Remove index helpers, revert to direct visual index |
| `packages/renderer/src/composables/useWidgetNode.ts` | `flow: false` nodes draggable, no locked class |
| `packages/renderer/src/action-registry.ts` | Restore drag/move for `flow: false` |
| `packages/themes/src/components/canvas.css` | Remove overlay CSS |
| `packages/designer/src/composables/useDragDrop.test.ts` | Remove index helper tests, update integration tests |
| `packages/renderer/src/composables/useWidgetNode.test.ts` | Update flow:false tests |

## Verification

1. `pnpm build` passes
2. `pnpm lint` passes
3. `pnpm typecheck` passes
4. Playground: TabBar renders at bottom via CSS `position: sticky`
5. Playground: TabBar is draggable (can change z-order)
6. Playground: Adding widgets after TabBar is not blocked
7. Playground: Navbar behavior unchanged
8. Playground: Flow widgets drag-drop works normally
