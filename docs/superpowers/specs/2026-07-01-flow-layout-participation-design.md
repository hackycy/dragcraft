# Flow Layout Participation Design

**Date:** 2026-07-01
**Status:** Draft

## Problem

The schema uses a flat `root.children` array where array index = visual position. The `sortable: false` mechanism locks a widget at its current index, which prevents any insertion that would shift it. When TabBar is placed at the end of the array, no new widgets can be added after it — `isInsertAllowed` blocks all insertions at indices >= TabBar's position.

The root cause: **array order** and **flow participation** are conflated. TabBar needs to exist on the page but not participate in the vertical content flow. The current `sortable: false` only locks position — it does not express "this node is outside the flow."

## Design

Add a `flow?: boolean` field to `WidgetMeta`. When `false`, the node:

1. Does not participate in the sortable constraint system
2. Is not draggable on the canvas
3. Renders in a separate overlay layer, independent of the flow

### Field Definition

```ts
// In WidgetMeta (packages/core/src/types.ts)
interface WidgetMeta {
  // ... existing fields

  /**
   * Whether this widget participates in the root container's vertical flow layout (default: true).
   * When false, the node is excluded from sortable constraints, is not draggable,
   * and renders in a separate overlay layer independent of the content flow.
   */
  flow?: boolean
}
```

`flow` is a **static boolean** on `WidgetMeta`, not a behavior predicate. A widget type's flow participation is intrinsic to the type — TabBar is always out of flow. This is intentionally simpler than the dynamic behavior predicates (`sortable`, `draggable`, etc.).

### Sortable System Changes

**File:** `packages/core/src/sortable.ts`

`getLockedIndices` currently iterates all children and checks `sortable` behavior. It must also skip nodes whose widget type has `flow: false`, since non-flow nodes do not participate in flow ordering at all.

```ts
export function getLockedIndices(
  children: SchemaNode[],
  registry: RegistryInstance,
  schema: DesignerSchema,
): Set<number> {
  const locked = new Set<number>()
  for (let i = 0; i < children.length; i++) {
    const meta = registry.getWidget(children[i].type)
    if (!meta)
      continue
    // Skip non-flow nodes entirely — they don't participate in flow ordering
    if (meta.flow === false)
      continue
    const isSortable = resolveBehavior(
      meta.sortable,
      { node: children[i], schema },
    )
    if (!isSortable) {
      locked.add(i)
    }
  }
  return locked
}
```

This single change propagates through the entire sortable system:
- `isInsertAllowed` — non-flow nodes no longer block insertions
- `isMoveAllowed` — non-flow nodes are never in `lockedIndices`
- `isRemoveAllowed` — non-flow nodes never block removal
- `getValidDropIndices` — drop positions are computed only against flow nodes

### Command Layer Changes

No changes needed. The three command handlers (`add-node.ts`, `move-node.ts`, `remove-node.ts`) all delegate to `getLockedIndices` which now skips non-flow nodes automatically.

### Drag-Drop Changes

**File:** `packages/designer/src/composables/useDragDrop.ts`

Three changes:

1. **`lockedIndices` computed** — already delegates to `getLockedIndices`, no change needed.

2. **`computeDropIndex` scope and index mapping** — currently queries all `[data-node-id]` elements in the canvas. After the renderer splits flow/overlay layers, this would include overlay nodes and corrupt the drop index. Additionally, `computeDropIndex` returns a visual index within the flow layer, but `ADD_NODE` needs an array index in `root.children`. When non-flow nodes exist in the array, these diverge. Solution:

```ts
// computeDropIndex queries only the flow layer
function computeDropIndex(e: DragEvent): number {
  const canvasEl = e.currentTarget as HTMLElement
  const flowEl = canvasEl.querySelector('.dc-canvas__flow') ?? canvasEl
  const widgetEls = flowEl.querySelectorAll<HTMLElement>(
    '[data-node-id]:not([data-node-id="root"])',
  )
  const mouseY = e.clientY
  for (let i = 0; i < widgetEls.length; i++) {
    const rect = widgetEls[i].getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    if (mouseY < midY)
      return i
  }
  return widgetEls.length
}

// Helper: convert flow-relative visual index to absolute array index in root.children
function flowIndexToArrayIndex(
  flowVisualIndex: number,
  rootChildren: SchemaNode[],
  registry: RegistryInstance,
): number {
  let flowCount = 0
  for (let i = 0; i < rootChildren.length; i++) {
    const meta = registry.getWidget(rootChildren[i].type)
    const isFlow = !meta || meta.flow !== false
    if (isFlow) {
      if (flowCount === flowVisualIndex)
        return i
      flowCount++
    }
  }
  return rootChildren.length
}
```

`handleCanvasDrop` uses `flowIndexToArrayIndex(visualIndex, children, engine.registry)` to convert before passing to `ADD_NODE`. The same conversion applies when moving existing flow nodes (`MOVE_NODE`).

3. **Drag start prevention** — `handleNodeDragStart` should refuse to start a drag for non-flow nodes. Add a check at the top of the function:

```ts
function handleNodeDragStart(e: DragEvent, nodeId: string): void {
  const children = engine.store.getRawSchema().root.children ?? []
  const node = children.find(c => c.id === nodeId)
  if (node) {
    const meta = engine.registry.getWidget(node.type)
    if (meta && meta.flow === false)
      return // non-flow nodes are not draggable
  }
  // ... existing logic
}
```

### Renderer Changes

**File:** `packages/renderer/src/components/RootRenderer.ts`

The render function currently maps all `root.children` to `WidgetRenderer` VNodes in array order. It must split them into two groups:

1. **Flow layer** — nodes with `flow !== false`, rendered in order inside `dc-canvas__flow`
2. **Overlay layer** — nodes with `flow === false`, rendered inside `dc-canvas__overlay`

```ts
return () => {
  const schema = props.engine.store.schema.value
  const rootChildren = schema.root.children ?? []

  // Split into flow and overlay groups
  const flowChildren: SchemaNode[] = []
  const overlayChildren: SchemaNode[] = []
  for (const child of rootChildren) {
    const meta = props.engine.registry.getWidget(child.type)
    if (meta && meta.flow === false)
      overlayChildren.push(child)
    else
      flowChildren.push(child)
  }

  // Flow layer VNodes (with drop indicator, forbidden overlay, etc.)
  const flowVNodes: VNode[] = flowChildren.map(child =>
    h(WidgetRenderer, { key: child.id, node: child }),
  )

  // ... drop indicator / forbidden overlay logic uses flowVNodes instead of childVNodes

  // Overlay layer VNodes
  const overlayVNodes: VNode[] = overlayChildren.map(child =>
    h(WidgetRenderer, { key: child.id, node: child }),
  )

  return h('div', { class: 'dc-root-renderer', ... }, [
    h(ContainerShell.value, { ... }, {
      default: () => [
        // Flow layer
        h('div', { class: 'dc-canvas__flow' }, flowVNodes),
        // Overlay layer (only rendered when non-empty)
        ...(overlayVNodes.length > 0
          ? [h('div', { class: 'dc-canvas__overlay' }, overlayVNodes)]
          : []),
      ],
    }),
  ])
}
```

The drop indicator and forbidden overlay logic operates on `flowVNodes` only — non-flow nodes are not valid drop targets.

### Action Registry Changes

**File:** `packages/renderer/src/action-registry.ts`

The drag handle action checks `draggable` and `sortable`. Since `useWidgetNode` will derive `draggable: false` for non-flow nodes (see below), the drag handle will be automatically disabled.

The move up/down actions check `isMoveAllowed` against locked indices. Since non-flow nodes are excluded from `lockedIndices`, these actions will not be blocked by them. However, move up/down should also be hidden for non-flow nodes since they don't participate in flow ordering. The existing `available` check on `sortable` handles this.

No direct changes needed — the existing behavior predicates cascade correctly.

### useWidgetNode Changes

**File:** `packages/renderer/src/composables/useWidgetNode.ts`

The `draggable` computed currently checks `sortable` as a prerequisite. It should also check `flow`:

```ts
const draggable = computed(() => {
  // Non-flow nodes are never draggable
  const flow = meta.value?.flow
  if (flow === false)
    return false
  // sortable: false implies not draggable
  if (!sortable.value)
    return false
  const field = meta.value?.draggable
  if (typeof field !== 'function')
    return field !== false
  return field(readInstanceCtx())
})
```

The `wrapperClasses` computed should add a class for non-flow nodes:

```ts
const wrapperClasses = computed<Array<string | Record<string, boolean>>>(() => [
  'dc-node',
  'dc-node--widget',
  {
    'dc-node--masked': useMask.value,
    'dc-node--unmasked': !useMask.value,
    'dc-node--non-selectable': !selectable.value,
    'dc-node--locked': !sortable.value,
    'dc-node--out-of-flow': meta.value?.flow === false,
  },
  state.interactionClasses.value,
])
```

### TabBar Widget Update

**File:** `playground/src/widgets/TabBarWidget.ts`

Replace `sortable: false` with `flow: false`. Remove `draggable: false` since `flow: false` implies it.

```ts
export const tabBarWidgetMeta: WidgetMeta = {
  type: 'tab-bar',
  title: 'Tab 栏',
  group: 'navigation',
  icon: 'tabbar',
  flow: false,          // out of flow — renders in overlay layer
  // draggable and sortable removed — flow: false implies both
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(c => c.type === 'tab-bar')
  },
  // ... rest unchanged
}
```

### Navbar Widget — No Change

Navbar stays as-is with `sortable: false`. It is always the first node in the flow and its position-locking behavior is correct. Changing it to `flow: false` would be a behavioral change — Navbar would no longer block insertions before it, which may or may not be desired. Out of scope for this change.

## Impact Summary

| Component | Current | After |
|-----------|---------|-------|
| TabBar | `sortable: false` locks position, blocks insertions | `flow: false` exits flow entirely |
| Navbar | `sortable: false` locks first position | Unchanged |
| All other widgets | `flow` defaults to `true` | Unchanged |

## Files Changed

| File | Change |
|------|--------|
| `packages/core/src/types.ts` | Add `flow?: boolean` to `WidgetMeta` |
| `packages/core/src/sortable.ts` | Skip `flow: false` nodes in `getLockedIndices` |
| `packages/renderer/src/components/RootRenderer.ts` | Split rendering into flow / overlay layers |
| `packages/renderer/src/composables/useWidgetNode.ts` | Derive `draggable: false` for non-flow nodes; add `dc-node--out-of-flow` class |
| `packages/designer/src/composables/useDragDrop.ts` | Block drag start for non-flow nodes |
| `playground/src/widgets/TabBarWidget.ts` | Replace `sortable: false` + `draggable: false` with `flow: false` |

## Verification

1. `pnpm build` passes
2. `pnpm lint` passes
3. `pnpm typecheck` passes
4. Playground: add TabBar, verify it renders in overlay layer (not inline in flow)
5. Playground: add TabBar, then add other widgets — insertion is not blocked
6. Playground: TabBar is not draggable on canvas
7. Playground: TabBar can still be deleted via toolbar
8. Playground: Navbar behavior unchanged (locked at first position)
9. Playground: existing drag-drop for flow widgets works normally
