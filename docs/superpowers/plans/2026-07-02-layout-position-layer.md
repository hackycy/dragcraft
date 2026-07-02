# Layout-Position Layer Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate instance-level positioning (`anchor`) and visibility (`visible`) from slot-level layout, enabling per-instance overlay positioning and conditional rendering.

**Architecture:** `anchor` moves from `LayoutSlotManifest` (type-level) to `NodeLayout.position` (instance-level). A new `visible` predicate on `NodeLayout` controls rendering. The shell discovers positioned nodes from the schema independently of the slot system. WidgetRenderer applies `.dc-node--hidden` CSS for invisible nodes in design mode.

**Tech Stack:** TypeScript, Vue 3 (Composition API), Vitest, pnpm workspace

## Global Constraints

- `structuredClone` is prohibited (use `@dragcraft/utils` cloneDeep)
- Unicode emojis are prohibited
- All packages must pass `pnpm build`, `pnpm lint`, `pnpm typecheck`
- Follow existing code style — no unrelated refactoring

## File Structure

| Package | File | Role |
|---------|------|------|
| core | `src/types.ts` | Define `NodePosition`; update `NodeLayout`, `ResolvedNodeLayout`, `LayoutSlotManifest` |
| core | `src/layout.ts` | Update `resolveNodeLayout` (visible, position); update `createLayoutPlan` (exclude position-only) |
| core | `src/layout.test.ts` | Tests for position resolution, visible predicate, position-only exclusion |
| core | `src/index.ts` | Export `NodePosition` |
| renderer | `src/types.ts` | Add `schema` to `ContainerShellProps` |
| renderer | `src/composables/useWidgetNode.ts` | Expose `visible` from resolved layout |
| renderer | `src/components/WidgetRenderer.ts` | Apply `.dc-node--hidden` class when `visible === false` |
| renderer | `src/components/RootRenderer.ts` | Pass `schema` to container shell props |
| themes | `src/components/canvas.css` | Add `.dc-node--hidden` styles |
| device-frames | `src/components/frame-slots.ts` | Add positioned node overlay rendering |
| device-frames | `src/components/DeviceFrameShell.ts` | Accept and forward `schema` prop |
| device-frames | `src/components/frames/*.ts` | Accept and forward `schema` prop |

---

### Task 1: Core types — NodePosition, NodeLayout, ResolvedNodeLayout, LayoutSlotManifest

**Files:**
- Modify: `packages/core/src/types.ts:41-98`

**Interfaces:**
- Produces: `NodePosition`, updated `NodeLayout`, `ResolvedNodeLayout`, `LayoutSlotManifest` — consumed by Tasks 2, 3, 4

- [ ] **Step 1: Add NodePosition interface**

In `packages/core/src/types.ts`, add `NodePosition` after the `LayoutAnchor` type (line 71):

```ts
export interface NodePosition {
  anchor: { block?: LayoutAnchor; inline?: LayoutAnchor }
}
```

- [ ] **Step 2: Update NodeLayout — add visible, position; remove data**

Replace the existing `NodeLayout` interface (lines 41-46) with:

```ts
export interface NodeLayout {
  slot?: string
  sortScope?: string | false
  order?: number
  visible?: boolean | ((ctx: { node: SchemaNode; schema: DesignerSchema }) => boolean)
  position?: NodePosition
}
```

- [ ] **Step 3: Update ResolvedNodeLayout — add visible, position; change slot type**

Replace the existing `ResolvedNodeLayout` interface (lines 48-53) with:

```ts
export interface ResolvedNodeLayout {
  slot: string | undefined
  sortScope: string | false
  order?: number
  visible: boolean
  position?: NodePosition
}
```

- [ ] **Step 4: Remove anchor from LayoutSlotManifest**

In the `LayoutSlotManifest` interface (lines 80-91), remove the `anchor` field (lines 84-87) and the `data` field (line 90):

```ts
export interface LayoutSlotManifest {
  allocation: LayoutAllocation
  axis?: LayoutAxis
  edge?: LayoutEdge
  order?: number
  className?: string
}
```

- [ ] **Step 5: Run typecheck to verify no compile errors**

Run: `pnpm typecheck`
Expected: May have errors in downstream files — that's expected, will be fixed in later tasks.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types.ts
git commit -m "feat(core): add NodePosition type, update NodeLayout with visible and position"
```

---

### Task 2: Core layout resolution — resolveNodeLayout and createLayoutPlan

**Files:**
- Modify: `packages/core/src/layout.ts:19-38,84-129`

**Interfaces:**
- Consumes: `NodePosition`, updated `NodeLayout`, `ResolvedNodeLayout` from Task 1
- Produces: Updated `resolveNodeLayout()` and `createLayoutPlan()` — consumed by Tasks 3, 5, 8, 10

- [ ] **Step 1: Update resolveNodeLayout to handle visible, position, and position-only slot suppression**

Replace the `resolveNodeLayout` function (lines 19-39) with:

```ts
export function resolveNodeLayout(
  node: SchemaNode,
  registry: RegistryInstance,
  schema?: DesignerSchema,
): ResolvedNodeLayout {
  const metaLayout = registry.getWidget(node.type)?.defaultLayout
  const layout: NodeLayout = {
    ...(metaLayout ?? {}),
    ...(node.layout ?? {}),
  }

  // If node has position but no explicit slot, suppress default slot assignment
  const hasPosition = !!layout.position
  const hasExplicitSlot = node.layout?.slot !== undefined
  const slot = layout.slot ?? (hasPosition && !hasExplicitSlot ? undefined : DEFAULT_LAYOUT_SLOT)

  const sortScope = layout.sortScope === undefined
    ? (slot === undefined ? false
      : slot === DEFAULT_LAYOUT_SLOT ? DEFAULT_SORT_SCOPE
      : false)
    : layout.sortScope

  // Resolve visible predicate
  const rawVisible = layout.visible ?? true
  const visible = typeof rawVisible === 'function'
    ? schema !== undefined && rawVisible({ node, schema })
    : rawVisible

  return {
    slot,
    sortScope,
    order: layout.order,
    visible,
    position: layout.position,
  }
}
```

- [ ] **Step 2: Update createLayoutPlan to pass schema and exclude position-only entries**

Replace the `createLayoutPlan` function (lines 84-129) with:

```ts
export function createLayoutPlan(
  schema: DesignerSchema,
  registry: RegistryInstance,
): LayoutPlan {
  const children = schema.root.children ?? []
  const entries: LayoutNodeEntry[] = []

  for (let arrayIndex = 0; arrayIndex < children.length; arrayIndex++) {
    const node = children[arrayIndex]
    const layout = resolveNodeLayout(node, registry, schema)

    // Position-only nodes (no slot) are excluded from the layout plan
    if (layout.slot === undefined)
      continue

    entries.push({ node, arrayIndex, layout })
  }

  const slots = new Map<string, LayoutNodeEntry[]>()
  const sortScopes = new Map<string, LayoutNodeEntry[]>()
  const slotManifests = new Map<string, ResolvedLayoutSlotManifest>()

  for (const meta of registry.getAllWidgets()) {
    for (const [slot, manifest] of Object.entries(meta.layoutManifest?.slots ?? {})) {
      const resolved = resolveSlotManifest(slot, manifest)
      if (resolved)
        slotManifests.set(slot, resolved)
    }
  }

  for (const entry of entries) {
    pushEntry(slots, entry.layout.slot!, entry)

    const sortScope = entry.layout.sortScope
    if (sortScope !== false)
      pushEntry(sortScopes, sortScope, entry)

    if (!slotManifests.has(entry.layout.slot!)) {
      const manifest = registry.getWidget(entry.node.type)?.layoutManifest?.slots?.[entry.layout.slot!]
      const resolved = resolveSlotManifest(entry.layout.slot!, manifest)
      if (resolved)
        slotManifests.set(entry.layout.slot!, resolved)
    }
  }

  for (const slotEntries of slots.values())
    sortEntries(slotEntries)
  for (const scopeEntries of sortScopes.values())
    sortEntries(scopeEntries)

  return { entries, slots, sortScopes, slotManifests }
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: Errors in downstream files that call `resolveNodeLayout` without the new `schema` parameter — will be fixed in Tasks 5, 8, 10.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/layout.ts
git commit -m "feat(core): update resolveNodeLayout for visible/position, exclude position-only from plan"
```

---

### Task 3: Core layout tests

**Files:**
- Modify: `packages/core/src/layout.test.ts`

**Interfaces:**
- Consumes: Updated `resolveNodeLayout`, `createLayoutPlan` from Task 2

- [ ] **Step 1: Update makeNode helper to support layout.position**

The existing `makeNode` helper already accepts a `layout` parameter. No change needed — `SchemaNode.layout` now supports `position`.

- [ ] **Step 2: Add test — position-only node excluded from layout plan**

Add after the existing tests:

```ts
it('excludes position-only nodes from the layout plan', () => {
  const children = [
    makeNode('a'),
    makeNode('fab', 'fab', { position: { anchor: { block: 'end', inline: 'end' } } }),
    makeNode('b'),
  ]
  const plan = createLayoutPlan(makeSchema(children), makeRegistry())

  expect(plan.entries.map(e => e.node.id)).toEqual(['a', 'b'])
  expect(plan.slots.get('content')!.map(e => e.node.id)).toEqual(['a', 'b'])
  expect(plan.slots.has('fab.surface')).toBe(false)
})
```

- [ ] **Step 3: Add test — node with both slot and position enters slot system**

```ts
it('nodes with both slot and position enter the slot system (slot wins)', () => {
  const children = [
    makeNode('a', 'text', { slot: 'content', position: { anchor: { block: 'end', inline: 'end' } } }),
  ]
  const plan = createLayoutPlan(makeSchema(children), makeRegistry())

  expect(plan.slots.get('content')!.map(e => e.node.id)).toEqual(['a'])
})
```

- [ ] **Step 4: Add test — visible defaults to true**

```ts
it('defaults visible to true when not specified', () => {
  const layout = resolveNodeLayout(makeNode('a'), makeRegistry())
  expect(layout.visible).toBe(true)
})
```

- [ ] **Step 5: Add test — visible boolean value**

```ts
it('resolves visible from boolean value', () => {
  const layout = resolveNodeLayout(makeNode('a', 'text', { visible: false }), makeRegistry())
  expect(layout.visible).toBe(false)
})
```

- [ ] **Step 6: Add test — visible predicate**

```ts
it('resolves visible from predicate function', () => {
  const schema = makeSchema([makeNode('a')])
  const reg = makeRegistry()
  const layout = resolveNodeLayout(
    makeNode('a', 'text', { visible: (ctx) => ctx.schema.globalConfig.loggedIn === true }),
    reg,
    schema,
  )
  expect(layout.visible).toBe(false)

  schema.globalConfig.loggedIn = true
  const layout2 = resolveNodeLayout(
    makeNode('a', 'text', { visible: (ctx) => ctx.schema.globalConfig.loggedIn === true }),
    reg,
    schema,
  )
  expect(layout2.visible).toBe(true)
})
```

- [ ] **Step 7: Add test — position resolved correctly**

```ts
it('resolves position from node layout', () => {
  const layout = resolveNodeLayout(
    makeNode('a', 'fab', { position: { anchor: { block: 'end', inline: 'start' } } }),
    makeRegistry(),
  )
  expect(layout.position).toEqual({ anchor: { block: 'end', inline: 'start' } })
})
```

- [ ] **Step 8: Add test — position-only node has no slot**

```ts
it('position-only nodes have no slot assigned', () => {
  const layout = resolveNodeLayout(
    makeNode('fab', 'fab', { position: { anchor: { block: 'end', inline: 'end' } } }),
    makeRegistry(),
  )
  expect(layout.slot).toBeUndefined()
  expect(layout.sortScope).toBe(false)
})
```

- [ ] **Step 9: Run tests**

Run: `pnpm --filter @dragcraft/core test`
Expected: All tests pass

- [ ] **Step 10: Commit**

```bash
git add packages/core/src/layout.test.ts
git commit -m "test(core): add layout tests for position, visible, and position-only exclusion"
```

---

### Task 4: Core exports

**Files:**
- Modify: `packages/core/src/index.ts:57-92`

**Interfaces:**
- Produces: `NodePosition` export — consumed by all downstream packages

- [ ] **Step 1: Add NodePosition to type exports**

In `packages/core/src/index.ts`, add `NodePosition` to the type exports block (around line 78, after `NodeLayout`):

```ts
  NodeLayout,
  NodePosition,
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: Core passes. Downstream errors remain — fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): export NodePosition type"
```

---

### Task 5: Renderer useWidgetNode — expose visible

**Files:**
- Modify: `packages/renderer/src/composables/useWidgetNode.ts:55,84-95,128-142`

**Interfaces:**
- Consumes: `ResolvedNodeLayout.visible` from Task 1, `resolveNodeLayout` with schema param from Task 2
- Produces: `visible: ComputedRef<boolean>` on `UseWidgetNodeReturn` — consumed by Task 6

- [ ] **Step 1: Update resolveNodeLayout call to pass schema**

In `useWidgetNode.ts`, the `layout` computed (line 55) currently reads:

```ts
const layout = computed(() => resolveNodeLayout(getNode(), engine.registry))
```

Change it to pass the raw schema for predicate evaluation:

```ts
const layout = computed(() => resolveNodeLayout(getNode(), engine.registry, engine.store.getRawSchema()))
```

Note: This computed already depends on `engine.store.schema.value` transitively through other computeds. But to ensure `visible` predicates re-evaluate when schema changes, the render function in WidgetRenderer already reads `ctx.engine.store.schema.value` (line 76). The `getRawSchema()` call here reads the same underlying data.

- [ ] **Step 2: Add visible computed**

After the `inSortScope` computed (line 56), add:

```ts
const visible = computed(() => layout.value.visible)
```

- [ ] **Step 3: Add visible to wrapperClasses**

In the `wrapperClasses` computed (lines 84-95), add `'dc-node--hidden': !visible.value` to the class map:

```ts
const wrapperClasses = computed<Array<string | Record<string, boolean>>>(() => [
  'dc-node',
  'dc-node--widget',
  {
    'dc-node--masked': useMask.value,
    'dc-node--unmasked': !useMask.value,
    'dc-node--non-selectable': !selectable.value,
    'dc-node--locked': inSortScope.value && !sortable.value,
    'dc-node--unsorted': !inSortScope.value,
    'dc-node--hidden': !visible.value,
  },
  state.interactionClasses.value,
])
```

- [ ] **Step 4: Add visible to return value**

In the return object (lines 128-142), add `visible`:

```ts
return {
  state,
  resolvedComponent,
  meta,
  useMask,
  selectable,
  draggable,
  sortable,
  inSortScope,
  visible,
  layout,
  wrapperClasses,
  handleSelect,
  handleMouseEnter,
  handleMouseLeave,
}
```

Also add `visible` to the `UseWidgetNodeReturn` interface (around line 25):

```ts
/** Whether this node is visible (from layout.visible, default true) */
visible: ComputedRef<boolean>
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: Renderer may have remaining errors from ContainerShellProps — fixed in Task 7.

- [ ] **Step 6: Commit**

```bash
git add packages/renderer/src/composables/useWidgetNode.ts
git commit -m "feat(renderer): expose visible from useWidgetNode, apply dc-node--hidden class"
```

---

### Task 6: Renderer WidgetRenderer — visible data attribute

**Files:**
- Modify: `packages/renderer/src/components/WidgetRenderer.ts:152-166`

**Interfaces:**
- Consumes: `widget.visible` from Task 5

- [ ] **Step 1: Add data-dc-visible attribute to the wrapper div**

In `WidgetRenderer.ts`, in the core wrapper `h()` call (lines 152-166), the CSS class already includes `widget.wrapperClasses.value` which now contains `dc-node--hidden`. No additional attribute is strictly needed, but adding a data attribute helps with debugging and testing.

Add after the `data-dc-sort-scope` attribute (line 161):

```ts
'data-dc-visible': widget.visible.value ? undefined : 'false',
```

- [ ] **Step 2: Commit**

```bash
git add packages/renderer/src/components/WidgetRenderer.ts
git commit -m "feat(renderer): add data-dc-visible attribute to widget wrapper"
```

---

### Task 7: Renderer ContainerShellProps and RootRenderer — pass schema

**Files:**
- Modify: `packages/renderer/src/types.ts:127-131`
- Modify: `packages/renderer/src/components/RootRenderer.ts:134-141`

**Interfaces:**
- Consumes: `DesignerSchema` from core
- Produces: `ContainerShellProps.schema` — consumed by Tasks 9, 10

- [ ] **Step 1: Add schema to ContainerShellProps**

In `packages/renderer/src/types.ts`, update the `ContainerShellProps` interface (lines 127-131):

```ts
import type { DesignerSchema, DesignerEngine, LayoutPlan, WidgetMeta } from '@dragcraft/core'
```

```ts
export interface ContainerShellProps {
  isEmpty: boolean
  slotVNodes: Record<string, VNode[]>
  layoutPlan: LayoutPlan
  schema: DesignerSchema
}
```

- [ ] **Step 2: Pass schema to container shell in RootRenderer**

In `packages/renderer/src/components/RootRenderer.ts`, in the `h(ContainerShell.value, ...)` call (lines 134-141), add `schema` to the props:

```ts
h(
  ContainerShell.value,
  {
    class: { 'dc-container-shell--empty': isEmpty },
    isEmpty,
    slotVNodes,
    layoutPlan: plan,
    schema,
  },
  // ... slots
),
```

The `schema` variable is already available from line 82: `const schema = props.engine.store.schema.value`.

- [ ] **Step 3: Update DefaultContainerShell to accept schema prop**

In `packages/renderer/src/components/DefaultContainerShell.ts`, add `schema` to the props:

```ts
props: {
  isEmpty: { type: Boolean, default: false },
  slotVNodes: { type: Object, default: () => ({}) },
  layoutPlan: { type: Object, default: undefined },
  schema: { type: Object, default: undefined },
},
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: Renderer passes. Device-frames may have errors — fixed in Task 9.

- [ ] **Step 5: Commit**

```bash
git add packages/renderer/src/types.ts packages/renderer/src/components/RootRenderer.ts packages/renderer/src/components/DefaultContainerShell.ts
git commit -m "feat(renderer): add schema to ContainerShellProps, pass from RootRenderer"
```

---

### Task 8: CSS — .dc-node--hidden styles

**Files:**
- Modify: `packages/themes/src/components/canvas.css`

**Interfaces:**
- Consumed by: WidgetRenderer (Task 5-6), device-frames shell (Task 9)

- [ ] **Step 1: Add .dc-node--hidden styles**

In `packages/themes/src/components/canvas.css`, add after the existing `.dc-node` styles:

```css
.dc-node--hidden {
  opacity: 0.4;
  outline: 1px dashed var(--dc-border, #999);
  outline-offset: -1px;
}
```

- [ ] **Step 2: Run build to verify CSS is included**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/themes/src/components/canvas.css
git commit -m "feat(themes): add dc-node--hidden styles for invisible nodes"
```

---

### Task 9: Device-frames — positioned node overlay rendering

**Files:**
- Modify: `packages/device-frames/src/components/frame-slots.ts`
- Modify: `packages/device-frames/src/components/DeviceFrameShell.ts`
- Modify: `packages/device-frames/src/components/frames/IPhoneFrame.ts`
- Modify: `packages/device-frames/src/components/frames/AndroidFrame.ts`
- Modify: `packages/device-frames/src/components/frames/TabletFrame.ts`
- Modify: `packages/device-frames/src/components/frames/DesktopFrame.ts`

**Interfaces:**
- Consumes: `ContainerShellProps.schema` from Task 7, `resolveNodeLayout` from Task 2
- Produces: Positioned overlay rendering in device frames

- [ ] **Step 1: Add positionedOverlay function to frame-slots.ts**

In `packages/device-frames/src/components/frame-slots.ts`, add after the `overlayLayer` function (line 63):

```ts
import type { DesignerSchema, RegistryInstance } from '@dragcraft/core'
import { resolveNodeLayout } from '@dragcraft/core'

function positionedOverlay(
  schema: DesignerSchema | undefined,
  registry: RegistryInstance | undefined,
  designMode = true,
): VNodeChild[] {
  if (!schema || !registry)
    return []

  const children = schema.root.children ?? []
  const positioned: Array<{ node: typeof children[0]; anchor: { block?: string; inline?: string }; visible: boolean }> = []

  for (const node of children) {
    const layout = resolveNodeLayout(node, registry, schema)
    if (layout.position) {
      // In preview mode, skip invisible nodes entirely
      if (!designMode && !layout.visible)
        continue
      positioned.push({ node, anchor: layout.position.anchor, visible: layout.visible })
    }
  }

  if (positioned.length === 0)
    return []

  return positioned.map(({ node, anchor, visible }) =>
    h('div', {
      'class': [
        'dc-device-frame__overlay-item',
        {
          'dc-device-frame__overlay-item--block-start': anchor.block === 'start',
          'dc-device-frame__overlay-item--block-center': anchor.block === 'center',
          'dc-device-frame__overlay-item--block-end': anchor.block === 'end' || !anchor.block,
          'dc-device-frame__overlay-item--inline-start': anchor.inline === 'start',
          'dc-device-frame__overlay-item--inline-center': anchor.inline === 'center',
          'dc-device-frame__overlay-item--inline-end': anchor.inline === 'end' || !anchor.inline,
          'dc-node--hidden': !visible,
        },
      ],
      'data-node-id': node.id,
    }),
  )
}
```

- [ ] **Step 2: Update renderFrameViewport to accept schema and registry**

Change the `renderFrameViewport` function signature (line 75) from:

```ts
export function renderFrameViewport(slots: Slots, plan?: LayoutPlan): VNodeChild[] {
```

to:

```ts
export function renderFrameViewport(
  slots: Slots,
  plan?: LayoutPlan,
  schema?: DesignerSchema,
  registry?: RegistryInstance,
  designMode = true,
): VNodeChild[] {
```

- [ ] **Step 3: Add positioned overlay layer to renderFrameViewport return**

In the return statement (lines 105-112), add the positioned overlay layer after the existing overlay:

```ts
const positioned = positionedOverlay(schema, registry, designMode)

return [
  reserveTrack('dc-device-frame__dock dc-device-frame__dock--block-start', top, slots),
  reserveTrack('dc-device-frame__dock dc-device-frame__dock--inline-start', inlineStart, slots),
  h('div', { class: 'dc-device-frame__content dc-container-shell' }, content),
  reserveTrack('dc-device-frame__dock dc-device-frame__dock--inline-end', inlineEnd, slots),
  reserveTrack('dc-device-frame__dock dc-device-frame__dock--block-end', bottom, slots),
  overlayLayer(overlay, slots),
  ...(positioned.length > 0 ? [h('div', { class: 'dc-device-frame__overlay dc-device-frame__positioned' }, positioned)] : []),
]
```

- [ ] **Step 4: Update DeviceFrameShell to accept and forward schema**

In `packages/device-frames/src/components/DeviceFrameShell.ts`, add `schema` prop and forward it:

```ts
import type { DesignerSchema, LayoutPlan } from '@dragcraft/core'

// ...

props: {
  layoutPlan: {
    type: Object as PropType<LayoutPlan>,
    default: undefined,
  },
  schema: {
    type: Object as PropType<DesignerSchema>,
    default: undefined,
  },
},

setup(props, { slots }) {
  const ctx = inject(DEVICE_FRAME_CONTEXT_KEY, null)

  const fallbackFrame = getDefaultPresets()[0].frameComponent

  const activeFrame = computed(() => {
    if (!ctx)
      return fallbackFrame
    const preset = ctx.getPreset(ctx.currentDevice.value)
    return preset?.frameComponent ?? fallbackFrame
  })

  return () =>
    h(activeFrame.value, { layoutPlan: props.layoutPlan, schema: props.schema }, slots)
},
```

- [ ] **Step 5: Update all frame components to accept schema and pass to renderFrameViewport**

Update each of the 4 frame components (`IPhoneFrame.ts`, `AndroidFrame.ts`, `TabletFrame.ts`, `DesktopFrame.ts`). The pattern is the same for all — add `schema` prop and forward to `renderFrameViewport`.

For `IPhoneFrame.ts`:

```ts
import type { DesignerSchema, LayoutPlan } from '@dragcraft/core'

// ...

props: {
  layoutPlan: {
    type: Object as PropType<LayoutPlan>,
    default: undefined,
  },
  schema: {
    type: Object as PropType<DesignerSchema>,
    default: undefined,
  },
},

// In setup, update the renderFrameViewport call:
h('div', { class: 'dc-device-frame__viewport' }, renderFrameViewport(slots, props.layoutPlan, props.schema)),
```

Repeat for `AndroidFrame.ts`, `TabletFrame.ts`, `DesktopFrame.ts` — same pattern.

- [ ] **Step 6: Run typecheck**

Run: `pnpm typecheck`
Expected: All packages pass.

- [ ] **Step 7: Run all tests**

Run: `pnpm test`
Expected: All tests pass. The DeviceFrameShell test constructs a plan manually — it doesn't pass `schema`, so `positionedOverlay` returns `[]` and existing behavior is preserved.

- [ ] **Step 8: Commit**

```bash
git add packages/device-frames/src/
git commit -m "feat(device-frames): add positioned node overlay rendering from schema"
```

---

### Task 10: Designer — exclude positioned nodes from sort scope

**Files:**
- Modify: `packages/designer/src/composables/useDragDrop.ts:108-114`

**Interfaces:**
- Consumes: `resolveNodeLayout` from Task 2

- [ ] **Step 1: Update resolveMetaSortScope to handle position-only metas**

In `useDragDrop.ts`, the `resolveMetaSortScope` function (lines 108-114) duplicates sort-scope resolution logic. For now, this function operates on `WidgetMeta` (pre-instantiation), not on `SchemaNode`. It doesn't need to handle `position` because position is instance-level.

However, when resolving sort scope for an existing node during drag, `resolveNodeLayout` is already called (line 129). Since `resolveNodeLayout` now returns `slot: undefined` for position-only nodes, the `sortScope` will be `false`, which correctly excludes them from sort scope calculations.

No code change needed in `resolveMetaSortScope` — it handles `WidgetMeta`, not `SchemaNode`.

- [ ] **Step 2: Verify positioned nodes are excluded from getActiveSortScopeEntries**

The `getActiveSortScopeEntries` function (lines 116-121) calls `createLayoutPlan` which now excludes position-only entries. This means positioned nodes automatically don't participate in sort scope calculations. No change needed.

- [ ] **Step 3: Run designer tests**

Run: `pnpm --filter @dragcraft/designer test`
Expected: All tests pass.

- [ ] **Step 4: Run full build and lint**

Run: `pnpm build && pnpm lint && pnpm typecheck`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/composables/useDragDrop.ts
git commit -m "chore(designer): verify positioned nodes excluded from sort scope (no code change needed)"
```

---

### Task 11: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 2: Run full build**

Run: `pnpm build`
Expected: All packages build successfully.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors.

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: All packages pass.
