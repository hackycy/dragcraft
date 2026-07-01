# Flow Layout Participation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `flow?: boolean` to `WidgetMeta` so non-flow nodes (like TabBar) exit the content flow, bypass sortable constraints, and render in a separate overlay layer.

**Architecture:** A static boolean `flow` on `WidgetMeta` (default `true`) declares whether a widget type participates in the root container's vertical flow. `getLockedIndices` skips `flow: false` nodes. `RootRenderer` splits children into flow/overlay layers. `useDragDrop` maps flow-visual indices to array indices.

**Tech Stack:** Vue 3, TypeScript, Vitest, pnpm monorepo

## Global Constraints

- `structuredClone` is prohibited
- Unicode emojis are prohibited
- Each package imports through pnpm workspace
- `pnpm build`, `pnpm lint`, `pnpm typecheck` must pass

---

### Task 1: Add `flow` field to `WidgetMeta`

**Files:**
- Modify: `packages/core/src/types.ts:140-198`

**Interfaces:**
- Produces: `WidgetMeta.flow?: boolean` — consumed by Tasks 2, 4, 5, 6

- [ ] **Step 1: Add `flow` field to `WidgetMeta`**

In `packages/core/src/types.ts`, add the `flow` field after the `deletable` field (line ~174), before the `// Material panel controls` section:

```ts
  /**
   * Whether this widget participates in the root container's vertical flow layout (default: true).
   * When false, the node is excluded from sortable constraints, is not draggable,
   * and renders in a separate overlay layer independent of the content flow.
   */
  flow?: boolean
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/types.ts
git commit -m "feat(core): add flow field to WidgetMeta"
```

---

### Task 2: Skip non-flow nodes in `getLockedIndices`

**Files:**
- Modify: `packages/core/src/sortable.ts:12-31`
- Test: `packages/core/src/sortable.test.ts`

**Interfaces:**
- Consumes: `WidgetMeta.flow` from Task 1
- Produces: `getLockedIndices` now skips `flow: false` nodes — consumed by Tasks 4, 5

- [ ] **Step 1: Write failing tests for `flow: false` skipping**

In `packages/core/src/sortable.test.ts`, update `makeRegistry` to support a `flow` field, then add tests. Replace the existing `makeRegistry` function:

```ts
function makeRegistry(metaMap: Record<string, { sortable?: boolean, flow?: boolean }> = {}): RegistryInstance {
  const map = new Map<string, WidgetMeta>()
  for (const [type, meta] of Object.entries(metaMap)) {
    map.set(type, { type, title: type, group: 'g', defaultProps: {}, formSchema: { sections: [] }, ...meta } as WidgetMeta)
  }
  return {
    registerWidget: () => {},
    registerGlobalConfigSchema: () => {},
    registerGlobalConfigFormSchema: () => {},
    getWidget: (type: string) => map.get(type),
    getGlobalConfigSchema: () => undefined,
    getAllWidgets: () => Array.from(map.values()),
  }
}
```

Update all existing `makeRegistry` calls to use the new signature:

```ts
// Old: makeRegistry({ text: true })
// New: makeRegistry({ text: { sortable: true } })

// Old: makeRegistry({ text: true, header: false })
// New: makeRegistry({ text: { sortable: true }, header: { sortable: false } })

// Old: makeRegistry({})
// New: makeRegistry()
```

Add new tests after the existing `getLockedIndices` tests:

```ts
  it('skips flow:false nodes from locked indices', () => {
    const children = [makeNode('a'), makeNode('b', 'tabbar'), makeNode('c')]
    const reg = makeRegistry({ text: { sortable: true }, tabbar: { flow: false } })
    const locked = getLockedIndices(children, reg, makeSchema(children))
    expect(locked.size).toBe(0)
  })

  it('flow:false nodes do not block locked flow nodes', () => {
    const children = [makeNode('a', 'header'), makeNode('b', 'tabbar'), makeNode('c')]
    const reg = makeRegistry({ header: { sortable: false }, tabbar: { flow: false }, text: { sortable: true } })
    const locked = getLockedIndices(children, reg, makeSchema(children))
    expect(locked).toEqual(new Set([0]))
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @dragcraft/core vitest run sortable.test.ts`
Expected: FAIL — `flow:false` nodes currently get locked instead of skipped

- [ ] **Step 3: Update `getLockedIndices` to skip `flow: false` nodes**

In `packages/core/src/sortable.ts`, add a check after `if (!meta) continue` on line 21:

```ts
    if (meta.flow === false)
      continue
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @dragcraft/core vitest run sortable.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/sortable.ts packages/core/src/sortable.test.ts
git commit -m "feat(core): skip flow:false nodes in getLockedIndices"
```

---

### Task 3: Update `add-node` command test for `flow: false`

**Files:**
- Test: `packages/core/src/commands/add-node.test.ts`

**Interfaces:**
- Consumes: `getLockedIndices` behavior from Task 2

- [ ] **Step 1: Add test for insert not blocked by `flow: false` node**

In `packages/core/src/commands/add-node.test.ts`, add after the existing "blocks insert when sortable constraint violated" test:

```ts
  it('allows insert when non-flow node is at the end', () => {
    const { ctx, registry, store } = setup(makeSchema([
      makeNode('a'),
      makeNode('tabbar'),
    ]))
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] } })
    registry.registerWidget({ type: 'tabbar', title: 'TabBar', group: 'nav', defaultProps: {}, formSchema: { sections: [] }, flow: false })

    addNodeHandler(ctx, { node: makeNode('new'), index: 1 })
    const children = store.getRawSchema().root.children!
    expect(children).toHaveLength(3)
    expect(children[1].id).toBe('new')
  })
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter @dragcraft/core vitest run commands/add-node.test.ts`
Expected: PASS (the sortable change from Task 2 makes this pass)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/commands/add-node.test.ts
git commit -m "test(core): add flow:false case to add-node command"
```

---

### Task 4: Update `useWidgetNode` for `flow: false`

**Files:**
- Modify: `packages/renderer/src/composables/useWidgetNode.ts:71-98`
- Test: `packages/renderer/src/composables/useWidgetNode.test.ts`

**Interfaces:**
- Consumes: `WidgetMeta.flow` from Task 1
- Produces: `draggable: false` for non-flow nodes, `dc-node--out-of-flow` CSS class

- [ ] **Step 1: Write failing tests**

In `packages/renderer/src/composables/useWidgetNode.test.ts`, add new test cases inside the `behavior predicates` describe block:

```ts
    it('flow:false implies draggable false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('tabbar', { flow: false }))
      const node = useWidgetNode(() => makeNode('a', 'tabbar'), ctx)
      expect(node.draggable.value).toBe(false)
    })

    it('flow:true does not affect draggable', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { flow: true }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      expect(node.draggable.value).toBe(true)
    })
```

Add a new test in the `wrapperClasses` describe block:

```ts
    it('includes out-of-flow class when flow is false', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('tabbar', { flow: false }))
      const node = useWidgetNode(() => makeNode('a', 'tabbar'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--out-of-flow']).toBe(true)
    })

    it('does not include out-of-flow class when flow is true', () => {
      vi.mocked(ctx.engine.registry.getWidget).mockReturnValue(makeMeta('text', { flow: true }))
      const node = useWidgetNode(() => makeNode('a'), ctx)
      const classObj = node.wrapperClasses.value.find(c => typeof c === 'object') as Record<string, boolean>
      expect(classObj['dc-node--out-of-flow']).toBe(false)
    })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @dragcraft/renderer vitest run composables/useWidgetNode.test.ts`
Expected: FAIL — `draggable` is still `true` for `flow: false` nodes

- [ ] **Step 3: Update `draggable` computed**

In `packages/renderer/src/composables/useWidgetNode.ts`, replace the `draggable` computed (lines 78-86):

```ts
  const draggable = computed(() => {
    // Non-flow nodes are never draggable
    if (meta.value?.flow === false)
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

- [ ] **Step 4: Update `wrapperClasses` computed**

In the same file, update the `wrapperClasses` computed (lines 88-98) to include `dc-node--out-of-flow`:

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

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @dragcraft/renderer vitest run composables/useWidgetNode.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/renderer/src/composables/useWidgetNode.ts packages/renderer/src/composables/useWidgetNode.test.ts
git commit -m "feat(renderer): derive draggable:false and out-of-flow class for flow:false nodes"
```

---

### Task 5: Update `useDragDrop` for `flow: false`

**Files:**
- Modify: `packages/designer/src/composables/useDragDrop.ts`
- Test: `packages/designer/src/composables/useDragDrop.test.ts`

**Interfaces:**
- Consumes: `WidgetMeta.flow` from Task 1, `getLockedIndices` from Task 2
- Produces: `flowIndexToArrayIndex` helper, drag-start guard for non-flow nodes

- [ ] **Step 1: Add `flowIndexToArrayIndex` helper**

In `packages/designer/src/composables/useDragDrop.ts`, add the helper function before the `useDragDrop` function (after imports):

```ts
/**
 * Convert a flow-relative visual index (from computeDropIndex) to an absolute
 * array index in root.children. Non-flow nodes in the array are skipped when
 * counting flow positions.
 */
export function flowIndexToArrayIndex(
  flowVisualIndex: number,
  rootChildren: SchemaNode[],
  registry: { getWidget: (type: string) => WidgetMeta | undefined },
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

- [ ] **Step 2: Update `computeDropIndex` to query only flow layer**

In the same file, update `computeDropIndex` (lines 90-104):

```ts
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
      if (mouseY < midY) {
        return i
      }
    }
    return widgetEls.length
  }
```

- [ ] **Step 3: Update `handleNodeDragStart` to block non-flow nodes**

In the same file, add a guard at the top of `handleNodeDragStart` (line ~120):

```ts
  function handleNodeDragStart(e: DragEvent, nodeId: string): void {
    // Non-flow nodes are not draggable
    const children = engine.store.getRawSchema().root.children ?? []
    const node = children.find(c => c.id === nodeId)
    if (node) {
      const meta = engine.registry.getWidget(node.type)
      if (meta && meta.flow === false)
        return
    }

    engine.store.setDragTarget({
```

- [ ] **Step 4: Update `handleCanvasDrop` to use `flowIndexToArrayIndex`**

In `handleCanvasDrop`, update both the move and add branches to convert the visual index. Replace the existing move branch (starting at `if (dragTarget.sourceNodeId)`):

```ts
    if (dragTarget.sourceNodeId) {
      // Moving existing node to the computed position
      const children = engine.store.getRawSchema().root.children ?? []
      const srcIdx = children.findIndex(c => c.id === dragTarget.sourceNodeId)

      // Convert flow-relative visual index to absolute array index
      let targetIdx = flowIndexToArrayIndex(visualIndex, children, engine.registry)

      // After the source is removed, items after it shift left by 1
      if (srcIdx !== -1 && targetIdx > srcIdx) {
        targetIdx = targetIdx - 1
      }

      engine.execute({
        type: CommandType.MOVE_NODE,
        payload: {
          nodeId: dragTarget.sourceNodeId,
          index: targetIdx,
        },
      })
    }
    else if (dragTarget.widgetType) {
      // Adding new widget from material panel
      const meta = engine.registry.getWidget(dragTarget.widgetType)
      if (!meta)
        return

      if (!resolveBehavior(meta.creatable, { widgetType: meta.type, schema: engine.store.getRawSchema() }))
        return

      const children = engine.store.getRawSchema().root.children ?? []
      const arrayIndex = flowIndexToArrayIndex(visualIndex, children, engine.registry)

      const newNode: SchemaNode = {
        id: generateShortId(),
        type: meta.type,
        props: { ...meta.defaultProps },
        style: meta.defaultStyle ? { ...meta.defaultStyle } : undefined,
      }

      engine.execute({
        type: CommandType.ADD_NODE,
        payload: {
          node: newNode,
          index: arrayIndex,
        },
      })

      engine.store.selectNode(newNode.id)
    }
```

- [ ] **Step 5: Write failing tests**

In `packages/designer/src/composables/useDragDrop.test.ts`, add a new describe block:

```ts
describe('flow:false nodes', () => {
  it('handleNodeDragStart does nothing for flow:false nodes', () => {
    engine.registerWidget(makeMeta('tabbar', { flow: false }))
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('t', 'tabbar') } })

    const dd = useDragDrop(engine)
    const e = mockDragEvent()
    dd.handleNodeDragStart(e, 't')

    // dragTarget should remain null (drag was blocked)
    expect(engine.store.dragTarget.value).toBeNull()
  })

  it('handleCanvasDrop inserts at correct array index when non-flow nodes exist', () => {
    engine.registerWidget(makeMeta('tabbar', { flow: false }))
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('t', 'tabbar') } })
    // children: [a, b, t(tabbar)]

    const dd = useDragDrop(engine)
    const meta = makeMeta('image')
    engine.registerWidget(meta)
    const e = mockDragEvent()

    dd.handleMaterialDragStart(e, meta)
    // Visual index 2 = after 'b' in flow layer
    dd.dragOverIndex.value = 2
    dd.handleCanvasDrop(e)

    const children = engine.store.schema.value.root.children!
    expect(children).toHaveLength(4)
    // 'image' should be inserted at array index 2 (before tabbar)
    expect(children[2].type).toBe('image')
    expect(children[3].type).toBe('tabbar')
  })
})
```

Also add a test for `flowIndexToArrayIndex`:

```ts
describe('flowIndexToArrayIndex', () => {
  it('returns array index for flow nodes', () => {
    const children = [makeNode('a'), makeNode('b')]
    const registry = { getWidget: () => undefined }
    expect(flowIndexToArrayIndex(0, children, registry)).toBe(0)
    expect(flowIndexToArrayIndex(1, children, registry)).toBe(1)
    expect(flowIndexToArrayIndex(2, children, registry)).toBe(2)
  })

  it('skips non-flow nodes when counting', () => {
    const children = [makeNode('a'), makeNode('t', 'tabbar'), makeNode('b')]
    const tabbarMeta = makeMeta('tabbar', { flow: false })
    const registry = { getWidget: (type: string) => type === 'tabbar' ? tabbarMeta : undefined }
    // flow nodes: a(0), b(1). tabbar is skipped.
    expect(flowIndexToArrayIndex(0, children, registry)).toBe(0) // 'a'
    expect(flowIndexToArrayIndex(1, children, registry)).toBe(2) // 'b'
    expect(flowIndexToArrayIndex(2, children, registry)).toBe(3) // end
  })

  it('returns children.length when flow index exceeds flow node count', () => {
    const children = [makeNode('a'), makeNode('t', 'tabbar')]
    const tabbarMeta = makeMeta('tabbar', { flow: false })
    const registry = { getWidget: (type: string) => type === 'tabbar' ? tabbarMeta : undefined }
    expect(flowIndexToArrayIndex(1, children, registry)).toBe(2) // end of array
  })
})
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @dragcraft/designer vitest run composables/useDragDrop.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/designer/src/composables/useDragDrop.ts packages/designer/src/composables/useDragDrop.test.ts
git commit -m "feat(designer): handle flow:false nodes in drag-drop with index mapping"
```

---

### Task 6: Update `RootRenderer` to split flow/overlay layers

**Files:**
- Modify: `packages/renderer/src/components/RootRenderer.ts`

**Interfaces:**
- Consumes: `WidgetMeta.flow` from registry lookup
- Produces: `dc-canvas__flow` and `dc-canvas__overlay` DOM containers

- [ ] **Step 1: Split children into flow/overlay groups**

In `packages/renderer/src/components/RootRenderer.ts`, replace the render function's child mapping logic (lines 82-110). Replace from `const rootChildren = schema.root.children ?? []` through the drop indicator logic:

```ts
    return () => {
      // Read schema.value to establish reactive dependency
      const schema = props.engine.store.schema.value
      const rootChildren = schema.root.children ?? []
      const isDragOver = props.dragOverNodeId?.value === 'root'

      // Resolve drop indicator and empty state components
      const DropIndicator = props.extensions?.dropIndicator ?? DefaultDropIndicator
      const EmptyState = props.extensions?.emptyState ?? DefaultEmptyState

      // Split into flow and overlay groups
      const flowChildren: typeof rootChildren = []
      const overlayChildren: typeof rootChildren = []
      for (const child of rootChildren) {
        const meta = props.engine.registry.getWidget(child.type)
        if (meta && meta.flow === false)
          overlayChildren.push(child)
        else
          flowChildren.push(child)
      }

      const flowVNodes: VNode[] = flowChildren.map(child =>
        h(WidgetRenderer, { key: child.id, node: child }),
      )

      // Show forbidden overlay or drop indicator at the computed insertion index
      const isForbidden = props.isForbidden?.value ?? false

      if (isDragOver && isForbidden) {
        flowVNodes.push(h(ForbiddenOverlay.value, {
          key: '__forbidden__',
          widgetType: props.engine.store.dragTarget.value?.widgetType ?? '',
        }))
      }
      else if (isDragOver) {
        const idx = props.dragOverIndex?.value
        if (idx != null && idx >= 0 && idx <= flowVNodes.length) {
          flowVNodes.splice(idx, 0, h(DropIndicator, { key: '__drop-indicator__' }))
        }
        else {
          flowVNodes.push(h(DropIndicator, { key: '__drop-indicator__' }))
        }
      }

      // Overlay layer VNodes
      const overlayVNodes: VNode[] = overlayChildren.map(child =>
        h(WidgetRenderer, { key: child.id, node: child }),
      )

      // Empty state placeholder (only when no flow children and not dragging)
      const isEmpty = flowChildren.length === 0 && !isDragOver

      return h(
        'div',
        {
          'class': 'dc-root-renderer',
          'data-node-id': 'root',
          'data-node-type': 'root',
        },
        [
          h(
            ContainerShell.value,
            { class: { 'dc-container-shell--empty': isEmpty } },
            {
              default: () => {
                if (isEmpty)
                  return [h(EmptyState, { isDragOver: false })]
                return [
                  h('div', { class: 'dc-canvas__flow' }, flowVNodes),
                  ...(overlayVNodes.length > 0
                    ? [h('div', { class: 'dc-canvas__overlay' }, overlayVNodes)]
                    : []),
                ]
              },
            },
          ),
        ],
      )
    }
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/renderer/src/components/RootRenderer.ts
git commit -m "feat(renderer): split flow/overlay layers in RootRenderer"
```

---

### Task 7: Update `TabBarWidget` to use `flow: false`

**Files:**
- Modify: `playground/src/widgets/TabBarWidget.ts:27-37`

**Interfaces:**
- Consumes: `WidgetMeta.flow` from Task 1

- [ ] **Step 1: Replace `sortable`/`draggable` with `flow`**

In `playground/src/widgets/TabBarWidget.ts`, replace the meta definition:

```ts
export const tabBarWidgetMeta: WidgetMeta = {
  type: 'tab-bar',
  title: 'Tab 栏',
  group: 'navigation',
  icon: 'tabbar',
  flow: false,
  creatable: (ctx) => {
    const children = ctx.schema.root.children ?? []
    return !children.some(c => c.type === 'tab-bar')
  },
```

(Remove `draggable: false` and `sortable: false` lines)

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add playground/src/widgets/TabBarWidget.ts
git commit -m "feat(playground): switch TabBarWidget to flow:false"
```

---

### Task 8: Full verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Manual playground verification**

Start the playground and verify:
1. Add TabBar — it renders at the bottom via `position: sticky`
2. Add other widgets after TabBar — insertion is NOT blocked
3. TabBar is not draggable on canvas
4. TabBar can be deleted via toolbar
5. Navbar behavior unchanged (locked at first position)
6. Existing flow widgets drag-drop works normally
