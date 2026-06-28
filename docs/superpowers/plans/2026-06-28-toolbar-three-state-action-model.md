# Toolbar Three-State Action Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change toolbar actions from disappearing when unavailable to showing a disabled state, by introducing a three-state model (hidden / disabled / enabled).

**Architecture:** Add an `available` predicate to `NodeActionDefinition` that controls whether an action is rendered but disabled (distinct from `visible` which controls whether it's rendered at all). Update built-in action definitions to use `visible` for widget-type filtering and `available` for capability filtering.

**Tech Stack:** TypeScript, Vue 3, Vitest

## Global Constraints

- `structuredClone` is prohibited
- Unicode character emojis are prohibited
- Match existing code style (comment density, naming, idiom)
- `pnpm build`, `pnpm lint`, and `pnpm typecheck` must pass after all changes

---

### Task 1: Add `available` field to `NodeActionDefinition` and update resolution logic

**Files:**
- Modify: `packages/renderer/src/action-registry.ts:87-117` (NodeActionDefinition interface)
- Modify: `packages/renderer/src/action-registry.ts:326-332` (resolve method)
- Test: `packages/renderer/src/action-registry.test.ts`

**Interfaces:**
- Produces: `NodeActionDefinition.available?: (ctx: NodeActionContext) => boolean` field
- Produces: Updated resolution logic where `disabled = !available || (def.disabled ? def.disabled(ctx) : false)`

- [ ] **Step 1: Write failing tests for `available` predicate**

Add the following tests inside the existing `describe('resolve', ...)` block in `packages/renderer/src/action-registry.test.ts`:

```ts
it('available: false renders action as disabled, not hidden', () => {
  const registry = createNodeActionRegistry()
  registry.register({
    key: 'test-action',
    label: 'Test',
    type: 'button',
    order: 500,
    available: () => false,
  })
  const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

  const resolved = registry.resolve(ctx, emptyHooks)
  const action = resolved.find(a => a.key === 'test-action')

  expect(action).toBeDefined()
  expect(action!.disabled).toBe(true)
  expect(action!.visible).toBe(true)
})

it('available: false takes precedence over disabled: false', () => {
  const registry = createNodeActionRegistry()
  registry.register({
    key: 'test-action',
    label: 'Test',
    type: 'button',
    order: 500,
    available: () => false,
    disabled: () => false,
  })
  const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

  const resolved = registry.resolve(ctx, emptyHooks)
  const action = resolved.find(a => a.key === 'test-action')

  expect(action).toBeDefined()
  expect(action!.disabled).toBe(true)
})

it('visible: false still hides action entirely', () => {
  const registry = createNodeActionRegistry()
  registry.register({
    key: 'test-action',
    label: 'Test',
    type: 'button',
    order: 500,
    visible: () => false,
  })
  const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

  const resolved = registry.resolve(ctx, emptyHooks)
  expect(resolved.find(a => a.key === 'test-action')).toBeUndefined()
})

it('actions without available predicate behave as before (default true)', () => {
  const registry = createNodeActionRegistry()
  registry.register({
    key: 'test-action',
    label: 'Test',
    type: 'button',
    order: 500,
    disabled: () => true,
  })
  const ctx = { node: makeNode(), index: 0, siblingCount: 3, meta: makeMeta(), engine }

  const resolved = registry.resolve(ctx, emptyHooks)
  const action = resolved.find(a => a.key === 'test-action')

  expect(action).toBeDefined()
  expect(action!.disabled).toBe(true)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd D:/Workspaces/dragcraft && pnpm -F @dragcraft/renderer test -- --run`
Expected: The new tests fail because `available` is not yet a recognized field and the resolution logic doesn't use it.

- [ ] **Step 3: Add `available` field to `NodeActionDefinition` interface**

In `packages/renderer/src/action-registry.ts`, add the `available` field to the `NodeActionDefinition` interface after the `visible` field (around line 102):

```ts
  /**
   * Whether this action is available (usable) for this node.
   * Return false to render the action in disabled state.
   * Distinct from `visible` — an action can be visible but unavailable.
   */
  available?: (ctx: NodeActionContext) => boolean
```

- [ ] **Step 4: Update resolution logic in `resolve()` method**

In `packages/renderer/src/action-registry.ts`, in the `resolve()` method (around lines 327-332), change the resolution logic from:

```ts
const visible = def.visible ? def.visible(ctx) : true
if (!visible)
  return null

const disabled = def.disabled ? def.disabled(ctx) : false
```

to:

```ts
const visible = def.visible ? def.visible(ctx) : true
if (!visible)
  return null

const available = def.available ? def.available(ctx) : true
const disabled = !available || (def.disabled ? def.disabled(ctx) : false)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd D:/Workspaces/dragcraft && pnpm -F @dragcraft/renderer test -- --run`
Expected: All tests pass, including the new ones.

- [ ] **Step 6: Run typecheck and lint**

Run: `cd D:/Workspaces/dragcraft && pnpm typecheck && pnpm lint`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd D:/Workspaces/dragcraft
git add packages/renderer/src/action-registry.ts packages/renderer/src/action-registry.test.ts
git commit -m "feat(renderer): add available predicate to NodeActionDefinition for three-state action model"
```

---

### Task 2: Add `available` field to `WidgetActionConfig.extra`

**Files:**
- Modify: `packages/core/src/types.ts:94-104` (WidgetActionConfig.extra type)

**Interfaces:**
- Produces: `WidgetActionConfig.extra[].available` field, matching the same context type as `visible`/`disabled`

- [ ] **Step 1: Add `available` field to `WidgetActionConfig.extra`**

In `packages/core/src/types.ts`, in the `WidgetActionConfig` interface's `extra` array type (around line 100), add the `available` field after the `disabled` field:

```ts
    disabled?: (ctx: { node: SchemaNode, index: number, siblingCount: number }) => boolean
    available?: (ctx: { node: SchemaNode, index: number, siblingCount: number }) => boolean
```

- [ ] **Step 2: Run typecheck**

Run: `cd D:/Workspaces/dragcraft && pnpm typecheck`
Expected: No errors. The `extra` items in the action registry's `resolve()` method already spread through generically, so this type addition is backward compatible.

- [ ] **Step 3: Commit**

```bash
cd D:/Workspaces/dragcraft
git add packages/core/src/types.ts
git commit -m "feat(core): add available field to WidgetActionConfig.extra type"
```

---

### Task 3: Update built-in action definitions to use three-state model

**Files:**
- Modify: `packages/renderer/src/action-registry.ts:174-273` (createDefaultActions function)
- Test: `packages/renderer/src/action-registry.test.ts`

**Interfaces:**
- Consumes: `NodeActionDefinition.available` from Task 1
- Produces: Built-in actions that are always visible but use `available` for capability checks

- [ ] **Step 1: Write test for three-state built-in actions**

Add the following test inside `describe('createDefaultActions', ...)` in `packages/renderer/src/action-registry.test.ts`:

```ts
it('built-in actions have available predicate instead of visible for capability checks', async () => {
  const { resolveBehavior } = await import('@dragcraft/core')
  vi.mocked(resolveBehavior).mockReturnValue(false)

  const actions = createDefaultActions()
  const dragAction = actions.find(a => a.key === ActionKey.DRAG)!
  const moveUpAction = actions.find(a => a.key === ActionKey.MOVE_UP)!
  const deleteAction = actions.find(a => a.key === ActionKey.DELETE)!

  // visible should always be true (or undefined) — actions conceptually apply
  expect(dragAction.visible).toBeUndefined()
  expect(moveUpAction.visible).toBeUndefined()
  expect(deleteAction.visible).toBeUndefined()

  // available should check capability
  const ctx = { node: { id: 'n', type: 't', props: {} }, index: 0, siblingCount: 1, meta: makeMeta(), engine: makeEngine() }
  expect(dragAction.available!(ctx as any)).toBe(false)
  expect(moveUpAction.available!(ctx as any)).toBe(false)
  expect(deleteAction.available!(ctx as any)).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd D:/Workspaces/dragcraft && pnpm -F @dragcraft/renderer test -- --run`
Expected: The new test fails because built-in actions still use `visible` for capability checks.

- [ ] **Step 3: Update built-in action definitions**

In `packages/renderer/src/action-registry.ts`, replace the `createDefaultActions` function (lines 174-273) with:

```ts
export function createDefaultActions(t?: (key: string, fallback?: string) => string): NodeActionDefinition[] {
  const _t = t ?? ((_, f) => f ?? '')
  return [
    {
      key: ActionKey.DRAG,
      label: _t('action.drag', '拖拽排序'),
      icon: IconDrag,
      type: 'drag-handle',
      order: 100,
      available: (ctx) => {
        const instanceCtx = toInstanceCtx(ctx)
        return resolveBehavior(ctx.meta?.draggable, instanceCtx)
          && resolveBehavior(ctx.meta?.sortable, instanceCtx)
      },
    },
    {
      key: ActionKey.MOVE_UP,
      label: _t('action.move-up', '上移'),
      icon: IconArrowUp,
      type: 'button',
      order: 200,
      available: (ctx) => {
        const instanceCtx = toInstanceCtx(ctx)
        return resolveBehavior(ctx.meta?.draggable, instanceCtx)
          && resolveBehavior(ctx.meta?.sortable, instanceCtx)
      },
      disabled: (ctx) => {
        if (ctx.index === 0)
          return true
        const children = ctx.engine.store.getRawSchema().root.children ?? []
        const lockedIndices = getLockedIndices(children, ctx.engine.registry, ctx.engine.store.getRawSchema())
        if (lockedIndices.size === 0)
          return false
        return !isMoveAllowed(ctx.index, ctx.index - 1, lockedIndices)
      },
      handler: (ctx, e) => {
        e.stopPropagation()
        if (ctx.index > 0) {
          ctx.engine.execute({
            type: CommandType.MOVE_NODE,
            payload: { nodeId: ctx.node.id, index: ctx.index - 1 },
          })
        }
      },
    },
    {
      key: ActionKey.MOVE_DOWN,
      label: _t('action.move-down', '下移'),
      icon: IconArrowDown,
      type: 'button',
      order: 300,
      available: (ctx) => {
        const instanceCtx = toInstanceCtx(ctx)
        return resolveBehavior(ctx.meta?.draggable, instanceCtx)
          && resolveBehavior(ctx.meta?.sortable, instanceCtx)
      },
      disabled: (ctx) => {
        if (ctx.index >= ctx.siblingCount - 1)
          return true
        const children = ctx.engine.store.getRawSchema().root.children ?? []
        const lockedIndices = getLockedIndices(children, ctx.engine.registry, ctx.engine.store.getRawSchema())
        if (lockedIndices.size === 0)
          return false
        return !isMoveAllowed(ctx.index, ctx.index + 1, lockedIndices)
      },
      handler: (ctx, e) => {
        e.stopPropagation()
        if (ctx.index < ctx.siblingCount - 1) {
          ctx.engine.execute({
            type: CommandType.MOVE_NODE,
            payload: { nodeId: ctx.node.id, index: ctx.index + 1 },
          })
        }
      },
    },
    {
      key: ActionKey.DELETE,
      label: _t('action.delete', '删除'),
      icon: IconDelete,
      type: 'button',
      order: 400,
      className: 'dc-node__toolbar-btn--delete',
      available: ctx => resolveBehavior(ctx.meta?.deletable, toInstanceCtx(ctx)),
      disabled: (ctx) => {
        const children = ctx.engine.store.getRawSchema().root.children ?? []
        const lockedIndices = getLockedIndices(children, ctx.engine.registry, ctx.engine.store.getRawSchema())
        if (lockedIndices.size === 0)
          return false
        return !isRemoveAllowed(ctx.index, lockedIndices)
      },
      handler: (ctx, e) => {
        e.stopPropagation()
        ctx.engine.execute({
          type: CommandType.REMOVE_NODE,
          payload: { nodeId: ctx.node.id },
        })
      },
    },
  ]
}
```

- [ ] **Step 4: Update the existing `filters out invisible actions` test**

The existing test at line 129 mocks `resolveBehavior` to return `false` once and expects the drag action to be absent. After the change, the drag action will be present but disabled (since `visible` is no longer used for capability checks). Update the test:

Replace:
```ts
it('filters out invisible actions', async () => {
    const { resolveBehavior } = await import('@dragcraft/core')
    vi.mocked(resolveBehavior).mockReturnValueOnce(false) // drag not visible

    const registry = createNodeActionRegistry()
    const ctx = {
      node: makeNode(),
      index: 0,
      siblingCount: 3,
      meta: makeMeta(),
      engine,
    }

    const resolved = registry.resolve(ctx, emptyHooks)
    expect(resolved.find(a => a.key === ActionKey.DRAG)).toBeUndefined()
  })
```

With:
```ts
it('renders actions as disabled when available returns false', async () => {
    const { resolveBehavior } = await import('@dragcraft/core')
    vi.mocked(resolveBehavior).mockReturnValue(false) // all capabilities unavailable

    const registry = createNodeActionRegistry()
    const ctx = {
      node: makeNode(),
      index: 0,
      siblingCount: 3,
      meta: makeMeta(),
      engine,
    }

    const resolved = registry.resolve(ctx, emptyHooks)
    const drag = resolved.find(a => a.key === ActionKey.DRAG)
    expect(drag).toBeDefined()
    expect(drag!.disabled).toBe(true)
  })
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd D:/Workspaces/dragcraft && pnpm -F @dragcraft/renderer test -- --run`
Expected: All tests pass.

- [ ] **Step 6: Run typecheck and lint**

Run: `cd D:/Workspaces/dragcraft && pnpm typecheck && pnpm lint`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd D:/Workspaces/dragcraft
git add packages/renderer/src/action-registry.ts packages/renderer/src/action-registry.test.ts
git commit -m "feat(renderer): use available predicate for built-in action capability checks"
```

---

### Task 4: Handle disabled state for drag-handle in DefaultNodeToolbar

**Files:**
- Modify: `packages/renderer/src/components/DefaultNodeToolbar.ts:54-66` (drag-handle rendering)
- Modify: `packages/themes/src/components/canvas.css:168-172` (add disabled class)

**Interfaces:**
- Consumes: `ResolvedNodeAction.disabled` (already exists, now set correctly by Tasks 1-3)
- Produces: Disabled drag-handle renders with `dc-node__toolbar-btn--disabled` class and no drag behavior

- [ ] **Step 1: Add CSS class for disabled drag-handle**

In `packages/themes/src/components/canvas.css`, add the following rule after the existing `:disabled` rule (after line 172):

```css
.dc-node__toolbar-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
```

- [ ] **Step 2: Update drag-handle rendering in DefaultNodeToolbar**

In `packages/renderer/src/components/DefaultNodeToolbar.ts`, replace the drag-handle rendering block (lines 55-66):

```ts
if (action.type === 'drag-handle') {
  return h('div', {
    class: [
      'dc-node__toolbar-btn',
      'dc-node__toolbar-btn--drag',
      action.className,
    ],
    title: action.label,
    draggable: true,
    onDragstart: props.onDragStart,
    onDragend: props.onDragEnd,
  }, typeof action.icon === 'string' ? action.icon : (action.icon ? h(action.icon) : undefined))
}
```

With:

```ts
if (action.type === 'drag-handle') {
  return h('div', {
    class: [
      'dc-node__toolbar-btn',
      'dc-node__toolbar-btn--drag',
      { 'dc-node__toolbar-btn--disabled': action.disabled },
      action.className,
    ],
    title: action.label,
    draggable: !action.disabled,
    onDragstart: action.disabled ? undefined : props.onDragStart,
    onDragend: action.disabled ? undefined : props.onDragEnd,
  }, typeof action.icon === 'string' ? action.icon : (action.icon ? h(action.icon) : undefined))
}
```

- [ ] **Step 3: Run build to verify no type errors**

Run: `cd D:/Workspaces/dragcraft && pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Run typecheck and lint**

Run: `cd D:/Workspaces/dragcraft && pnpm typecheck && pnpm lint`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd D:/Workspaces/dragcraft
git add packages/renderer/src/components/DefaultNodeToolbar.ts packages/themes/src/components/canvas.css
git commit -m "feat(renderer): handle disabled state for drag-handle in DefaultNodeToolbar"
```

---

### Task 5: Verify end-to-end with full build and test suite

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd D:/Workspaces/dragcraft && pnpm -r test -- --run`
Expected: All tests pass across all packages.

- [ ] **Step 2: Run full build**

Run: `cd D:/Workspaces/dragcraft && pnpm build`
Expected: Build succeeds for all packages.

- [ ] **Step 3: Run lint**

Run: `cd D:/Workspaces/dragcraft && pnpm lint`
Expected: No errors.

- [ ] **Step 4: Run typecheck**

Run: `cd D:/Workspaces/dragcraft && pnpm typecheck`
Expected: No errors.
