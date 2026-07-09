# Architecture Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the architectural issues found in the repository review: command consistency, public mutation boundaries, core/UI coupling, binding translation placement, and documentation drift.

**Architecture:** Apply the fixes in dependency order. First make command execution truthful, then add a safer engine state facade, then reduce UI type leakage from core, then extract property binding translation into a pure service, and finally update architecture docs to match the code. Keep compatibility where possible by introducing safer APIs before removing legacy APIs.

**Tech Stack:** TypeScript, Vue 3 Composition API, pnpm 11, Turborepo, Vitest, tsdown.

## Global Constraints

- Do not directly edit schema from UI code; schema writes must go through `engine.execute()`.
- Keep package layering: `core` cannot depend on `renderer`, `designer`, `form-generator`, `fields`, `widgets`, `themes`, or `device-frames`.
- Preserve the existing flat schema model: `schema.root.children` is the widget list.
- Preserve the existing headless styling model: UI packages emit `dc-*` classes and do not import theme CSS.
- Use TDD for behavior changes: write or adjust failing tests before implementation.
- Keep changes small and reviewable; commit after each task.

---

## File Structure

- `packages/core/src/command-bus.ts` owns command execution, history snapshots, rollback, update triggers, and mutation events.
- `packages/core/src/commands/*.ts` owns built-in command handlers and must explicitly return `false` for no-op or rejected commands.
- `packages/core/src/merge-record.ts` will own shared plain-record merge semantics used by core mutation paths.
- `packages/core/src/types.ts` owns public protocol types. It will gain `CommandResult` and `EngineState`, and it will stop importing Vue `Component`.
- `packages/core/src/engine.ts` owns engine assembly. It will expose `engine.state` as a safe read/runtime-state facade while keeping `engine.store` as a deprecated internal escape hatch during migration.
- `packages/designer/src/bindings/field-binding.ts` will own form field binding resolution and binding-to-command translation.
- `packages/designer/src/composables/usePropertyBinding.ts` will become orchestration only: select node, compute values, dispatch commands produced by binding helpers.
- `packages/renderer/src/types.ts`, `packages/renderer/src/action-registry.ts`, and `packages/renderer/src/composables/useWidgetNode.ts` will own renderer-specific widget UI metadata types.
- `.github/architecture/*.md` and `README.md` will be updated after code behavior changes land.

## Scope Check

This plan intentionally covers one dependent refactor sequence rather than several independent plans because later fixes depend on earlier boundaries. The only independent cleanup included is docs synchronization, which is deliberately last so docs describe the final code.

---

### Task 1: Make Command Execution No-Op Safe

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/command-bus.ts`
- Modify: `packages/core/src/commands/add-node.ts`
- Modify: `packages/core/src/commands/move-node.ts`
- Modify: `packages/core/src/commands/remove-node.ts`
- Modify: `packages/core/src/commands/update-props.ts`
- Modify: `packages/core/src/commands/set-global-config.ts`
- Test: `packages/core/src/command-bus.test.ts`
- Test: `packages/core/src/engine.test.ts`

**Interfaces:**
- Consumes: existing `Command<T>`, `CommandHandler<T>`, `CommandBusInstance.execute(command): void`.
- Produces: `CommandResult = false | void`; handlers return `false` when no schema mutation should be recorded.

- [ ] **Step 1: Write failing CommandBus tests for no-op semantics**

Add these tests inside `describe('createCommandBus', () => { ... })` in `packages/core/src/command-bus.test.ts`:

```ts
  it('execute treats false as an unchanged command', () => {
    const { commandBus, eventHub, history, store } = setup(
      makeSchema([{ id: 'a', type: 'text', props: { label: 'original' } }]),
    )
    const triggerUpdate = vi.spyOn(store, 'triggerUpdate')
    const schemaChanged = vi.fn()
    eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    commandBus.registerHandler('NO_CHANGE', () => false)
    commandBus.execute({ type: 'NO_CHANGE', payload: null })

    expect(history.canUndo()).toBe(false)
    expect(triggerUpdate).not.toHaveBeenCalled()
    expect(schemaChanged).not.toHaveBeenCalled()
  })

  it('execute records void handlers as changed commands', () => {
    const { commandBus, eventHub, history, store } = setup()
    const triggerUpdate = vi.spyOn(store, 'triggerUpdate')
    const schemaChanged = vi.fn()
    eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    commandBus.registerHandler('CHANGED', () => {})
    commandBus.execute({ type: 'CHANGED', payload: null })

    expect(history.canUndo()).toBe(true)
    expect(triggerUpdate).toHaveBeenCalledTimes(1)
    expect(schemaChanged).toHaveBeenCalledTimes(1)
  })
```

- [ ] **Step 2: Write failing engine tests for invalid built-in commands**

Add these tests inside `describe('createEngine', () => { ... })` in `packages/core/src/engine.test.ts`:

```ts
  it('invalid MOVE_NODE does not push history or emit schema changed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a')]) })
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    engine.execute({ type: CommandType.MOVE_NODE, payload: { nodeId: 'missing', index: 0 } })

    expect(engine.history.canUndo()).toBe(false)
    expect(schemaChanged).not.toHaveBeenCalled()
    warn.mockRestore()
    engine.dispose()
  })

  it('invalid REMOVE_NODE does not push history or emit schema changed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a')]) })
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    engine.execute({ type: CommandType.REMOVE_NODE, payload: { nodeId: 'root' } })

    expect(engine.history.canUndo()).toBe(false)
    expect(schemaChanged).not.toHaveBeenCalled()
    warn.mockRestore()
    engine.dispose()
  })

  it('invalid UPDATE_PROPS does not push history or emit schema changed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a')]) })
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'missing', props: { label: 'ignored' } },
    })

    expect(engine.history.canUndo()).toBe(false)
    expect(schemaChanged).not.toHaveBeenCalled()
    warn.mockRestore()
    engine.dispose()
  })
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
pnpm -F @dragcraft/core test -- command-bus.test.ts engine.test.ts
```

Expected: at least the new invalid built-in command tests fail because handlers return `undefined` and `CommandBus` records them as changed.

- [ ] **Step 4: Add the command result type**

In `packages/core/src/types.ts`, replace the current `CommandHandler` declaration with:

```ts
export type CommandResult = false | void

export type CommandHandler<T = unknown> = (
  ctx: CommandContext,
  payload: T,
) => CommandResult
```

Also add `CommandResult` to the `export type { ... }` block in `packages/core/src/index.ts`:

```ts
  CommandResult,
```

- [ ] **Step 5: Keep CommandBus behavior explicit**

In `packages/core/src/command-bus.ts`, change the local result type:

```ts
    let result: false | void
```

Keep this existing branch as the only unchanged-command branch:

```ts
    if (result === false) {
      store.setSchema(beforeSnapshot)
      return
    }
```

This preserves current changed-command behavior for `void` handlers while making handler intent explicit through `CommandResult`.

- [ ] **Step 6: Return false from built-in no-op paths**

In `packages/core/src/commands/move-node.ts`, change the signature and every no-op return:

```ts
export function moveNodeHandler(ctx: CommandContext, payload: MoveNodePayload): boolean | void {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()
  const children = rawSchema.root.children

  if (!children)
    return false

  const currentIndex = children.findIndex(c => c.id === payload.nodeId)
  if (currentIndex === -1) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" not found`)
    return false
  }

  const sourceLayout = resolveNodeLayout(children[currentIndex], registry)
  if (sourceLayout.sortScope === false) {
    console.warn(`[dragcraft/core] MOVE_NODE: node "${payload.nodeId}" is outside sortable scopes`)
    return false
  }
```

Also change these existing branches in the same file:

```ts
    return false
```

for `sourceScopeIndex === -1` and for blocked sortable constraints.

In `packages/core/src/commands/remove-node.ts`, change the signature and no-op paths:

```ts
export function removeNodeHandler(ctx: CommandContext, payload: RemoveNodePayload): boolean | void {
  const { store, registry } = ctx
  const rawSchema = store.getRawSchema()

  if (payload.nodeId === rawSchema.root.id) {
    console.warn('[dragcraft/core] REMOVE_NODE: cannot remove root node')
    return false
  }
```

Also change the sortable blocked branch and not-found branch to:

```ts
          return false
```

and:

```ts
    return false
```

In `packages/core/src/commands/update-props.ts`, change the signature and not-found branch:

```ts
export function updatePropsHandler(ctx: CommandContext, payload: UpdatePropsPayload): boolean | void {
  const { store } = ctx
  const rawSchema = store.getRawSchema()
  const node = findNodeById(rawSchema.root, payload.nodeId)

  if (!node) {
    console.warn(`[dragcraft/core] UPDATE_PROPS: node "${payload.nodeId}" not found`)
    return false
  }
```

Leave `add-node.ts` as `boolean | void`; it already returns `false` for blocked creation and blocked sorting. Leave `set-global-config.ts` as changed for every valid call.

- [ ] **Step 7: Run targeted tests**

Run:

```bash
pnpm -F @dragcraft/core test -- command-bus.test.ts engine.test.ts add-node.test.ts move-node.test.ts remove-node.test.ts update-props.test.ts
```

Expected: all targeted tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/index.ts packages/core/src/command-bus.ts packages/core/src/commands/add-node.ts packages/core/src/commands/move-node.ts packages/core/src/commands/remove-node.ts packages/core/src/commands/update-props.ts packages/core/src/commands/set-global-config.ts packages/core/src/command-bus.test.ts packages/core/src/engine.test.ts
git commit -m "fix(core): avoid recording no-op commands"
```

---

### Task 2: Centralize Core Merge Semantics

**Files:**
- Create: `packages/core/src/merge-record.ts`
- Create: `packages/core/src/merge-record.test.ts`
- Modify: `packages/core/src/schema-store.ts`
- Modify: `packages/core/src/commands/update-props.ts`
- Modify: `packages/core/src/commands/set-global-config.ts`

**Interfaces:**
- Consumes: none from Task 1 except normal command behavior.
- Produces: `isPlainRecord(value: unknown): value is Record<string, unknown>` and `mergeRecord(target: Record<string, unknown>, patch: Record<string, unknown>): void`.

- [ ] **Step 1: Write failing merge utility tests**

Create `packages/core/src/merge-record.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isPlainRecord, mergeRecord } from './merge-record'

describe('merge-record', () => {
  it('detects only non-array objects as plain records', () => {
    expect(isPlainRecord({})).toBe(true)
    expect(isPlainRecord(Object.create(null))).toBe(true)
    expect(isPlainRecord([])).toBe(false)
    expect(isPlainRecord(null)).toBe(false)
    expect(isPlainRecord('x')).toBe(false)
  })

  it('deep merges nested records and replaces arrays', () => {
    const target: Record<string, unknown> = {
      props: { title: 'Old', tags: ['a'] },
      style: { container: { marginTop: 4 } },
    }

    mergeRecord(target, {
      props: { tags: ['b'] },
      style: { container: { marginBottom: 8 } },
    })

    expect(target).toEqual({
      props: { title: 'Old', tags: ['b'] },
      style: { container: { marginTop: 4, marginBottom: 8 } },
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm -F @dragcraft/core test -- merge-record.test.ts
```

Expected: FAIL with an import resolution error because `merge-record.ts` does not exist.

- [ ] **Step 3: Create the shared merge utility**

Create `packages/core/src/merge-record.ts`:

```ts
export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function mergeRecord(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(patch)) {
    const current = target[key]
    if (isPlainRecord(current) && isPlainRecord(value)) {
      mergeRecord(current, value)
    }
    else {
      target[key] = value
    }
  }
}
```

- [ ] **Step 4: Replace duplicate merge helpers**

In `packages/core/src/schema-store.ts`, remove local `isPlainRecord` and `mergeRecord`, and add:

```ts
import { mergeRecord } from './merge-record'
```

In `packages/core/src/commands/update-props.ts`, remove local `isPlainRecord` and `mergeRecord`, and add:

```ts
import { mergeRecord } from '../merge-record'
```

In `packages/core/src/commands/set-global-config.ts`, remove local `isPlainRecord` and `mergeRecord`, and add:

```ts
import { mergeRecord } from '../merge-record'
```

- [ ] **Step 5: Run targeted tests**

Run:

```bash
pnpm -F @dragcraft/core test -- merge-record.test.ts schema-store.test.ts update-props.test.ts set-global-config.test.ts
```

Expected: all targeted tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/merge-record.ts packages/core/src/merge-record.test.ts packages/core/src/schema-store.ts packages/core/src/commands/update-props.ts packages/core/src/commands/set-global-config.ts
git commit -m "refactor(core): centralize record merge semantics"
```

---

### Task 3: Add a Safe Engine State Facade

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/engine.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/engine.test.ts`
- Modify: `packages/designer/src/composables/usePropertyBinding.ts`
- Modify: `packages/designer/src/composables/useDragDrop.ts`
- Modify: `packages/designer/src/components/DcStructurePanel.ts`
- Modify: `packages/renderer/src/action-registry.ts`
- Modify: `packages/renderer/src/composables/useNodeActions.ts`
- Modify: `packages/renderer/src/composables/useWidgetNode.ts`

**Interfaces:**
- Consumes: existing `DesignerEngine.store`.
- Produces:
  - `EngineState.getSchema(): DesignerSchema`
  - `EngineState.getNodeById(id: string): SchemaNode | null`
  - `EngineState.getSelectedNodeId(): string | null`
  - `EngineState.getHoveredNodeId(): string | null`
  - `EngineState.getDragTarget(): DragTarget | null`
  - `DesignerEngine.state: EngineState`

- [ ] **Step 1: Write failing tests for safe state snapshots**

Add these tests to `packages/core/src/engine.test.ts`:

```ts
  it('state.getSchema returns a clone that cannot mutate internal schema', () => {
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a')]) })

    const snapshot = engine.state.getSchema()
    snapshot.root.children!.push(makeNode('b'))

    expect(engine.store.schema.value.root.children).toHaveLength(1)
    expect(engine.state.getSchema().root.children).toHaveLength(1)
    engine.dispose()
  })

  it('state.getNodeById returns a clone that cannot mutate internal schema', () => {
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a')]) })

    const node = engine.state.getNodeById('a')
    node!.props.label = 'mutated'

    expect(engine.store.schema.value.root.children![0].props.label).toBeUndefined()
    engine.dispose()
  })

  it('state exposes runtime selection, hover, and drag target snapshots', () => {
    const engine = createEngine()

    engine.store.selectNode('selected')
    engine.store.hoverNode('hovered')
    engine.store.setDragTarget({ sourceNodeId: null, widgetType: 'text' })

    expect(engine.state.getSelectedNodeId()).toBe('selected')
    expect(engine.state.getHoveredNodeId()).toBe('hovered')
    expect(engine.state.getDragTarget()).toEqual({ sourceNodeId: null, widgetType: 'text' })
    engine.dispose()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm -F @dragcraft/core test -- engine.test.ts
```

Expected: FAIL with `Cannot read properties of undefined (reading 'getSchema')` because `engine.state` does not exist.

- [ ] **Step 3: Add EngineState type**

In `packages/core/src/types.ts`, add after `EngineOptions`:

```ts
export interface EngineState {
  getSchema: () => DesignerSchema
  getNodeById: (id: string) => SchemaNode | null
  getSelectedNodeId: () => string | null
  getHoveredNodeId: () => string | null
  getDragTarget: () => DragTarget | null
}
```

Add `EngineState` to `packages/core/src/index.ts` type exports:

```ts
  EngineState,
```

- [ ] **Step 4: Implement engine.state**

In `packages/core/src/engine.ts`, import the helper and type:

```ts
import type {
  Command,
  CommandHandler,
  DesignerSchema,
  EngineOptions,
  EngineState,
  RegistryInstance,
  SchemaMigration,
  SchemaStoreInstance,
  WidgetMeta,
} from './types'
import { findNodeById } from './helpers'
```

Add `state` to `DesignerEngine`:

```ts
  state: EngineState
```

Inside `createEngine`, after `commandBus` is created, add:

```ts
  const state: EngineState = {
    getSchema: () => store.getSchema(),
    getNodeById: (id) => {
      const schema = store.getSchema()
      return findNodeById(schema.root, id)
    },
    getSelectedNodeId: () => store.selectedNodeId.value,
    getHoveredNodeId: () => store.hoveredNodeId.value,
    getDragTarget: () => {
      const target = store.dragTarget.value
      return target ? { ...target } : null
    },
  }
```

Include `state` in the returned engine object:

```ts
    state,
```

- [ ] **Step 5: Replace read-only raw schema reads in UI layers**

Use this replacement rule in designer and renderer files listed above:

```ts
engine.store.getRawSchema()
```

becomes:

```ts
engine.state.getSchema()
```

When a node lookup is read-only, replace:

```ts
engine.store.getNodeById(nodeId)
```

with:

```ts
engine.state.getNodeById(nodeId)
```

Keep `engine.store.selectNode()`, `engine.store.hoverNode()`, and `engine.store.setDragTarget()` for runtime interaction state in this task. Those are not schema writes.

- [ ] **Step 6: Run cross-package tests**

Run:

```bash
pnpm -F @dragcraft/core test -- engine.test.ts
pnpm -F @dragcraft/designer test -- usePropertyBinding.test.ts useDragDrop.test.ts DcStructurePanel.test.ts
pnpm -F @dragcraft/renderer test -- action-registry.test.ts useWidgetNode.test.ts useNodeActions.test.ts
```

Expected: all targeted tests pass. If a renderer test fixture builds a fake engine without `state`, update that fixture to include:

```ts
state: {
  getSchema: () => engine.store.getSchema(),
  getNodeById: (id: string) => engine.store.getSchema().root.children?.find(node => node.id === id) ?? null,
  getSelectedNodeId: () => engine.store.selectedNodeId.value,
  getHoveredNodeId: () => engine.store.hoveredNodeId.value,
  getDragTarget: () => engine.store.dragTarget.value,
},
```

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/engine.ts packages/core/src/index.ts packages/core/src/engine.test.ts packages/designer/src/composables/usePropertyBinding.ts packages/designer/src/composables/useDragDrop.ts packages/designer/src/components/DcStructurePanel.ts packages/renderer/src/action-registry.ts packages/renderer/src/composables/useNodeActions.ts packages/renderer/src/composables/useWidgetNode.ts packages/renderer/src/*.test.ts packages/renderer/src/composables/*.test.ts
git commit -m "refactor(core): expose safe engine state facade"
```

---

### Task 4: Remove Direct Vue Component Types from Core Protocol

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/package.json`
- Modify: `packages/renderer/src/types.ts`
- Modify: `packages/renderer/src/action-registry.ts`
- Modify: `packages/renderer/src/composables/useWidgetNode.ts`
- Modify: `packages/widgets/src/types.ts`
- Test: `packages/renderer/src/action-registry.test.ts`
- Test: `packages/widgets/src/index.test.ts`

**Interfaces:**
- Consumes: `CoreWidgetMeta` from `@dragcraft/core`.
- Produces:
  - `CoreWidgetMeta` in `@dragcraft/core`, with no Vue `Component` fields.
  - `WidgetMeta` remains exported from `@dragcraft/core` as an alias to `CoreWidgetMeta` for compatibility.
  - `RendererWidgetMeta extends CoreWidgetMeta` in `@dragcraft/renderer`, adding `actions?: WidgetActionConfig` and `wrapper?: Component`.

- [ ] **Step 1: Write type-level renderer meta test**

Add this compile-time assertion to `packages/renderer/src/action-registry.test.ts` near the top of the file:

```ts
import type { RendererWidgetMeta } from './types'

it('accepts renderer-specific widget metadata with Vue UI fields', () => {
  const meta: RendererWidgetMeta = {
    type: 'text',
    title: 'Text',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    actions: { exclude: ['delete'] },
  }

  expect(meta.actions?.exclude).toEqual(['delete'])
})
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run:

```bash
pnpm typecheck
```

Expected: FAIL because `RendererWidgetMeta` is not exported yet.

- [ ] **Step 3: Split the core widget metadata type**

In `packages/core/src/types.ts`, remove `Component` from the Vue import:

```ts
import type { Ref, ShallowRef } from 'vue'
```

Replace the current `WidgetActionConfig` and `WidgetMeta` block with:

```ts
export interface CoreWidgetActionConfig {
  only?: string[]
  exclude?: string[]
}

export interface CoreWidgetMeta {
  type: string
  title: string
  titleKey?: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  defaultStyle?: NodeStyle
  formSchema: FormSchemaShape
  mask?: BehaviorPredicate<InstanceBehaviorContext>
  selectable?: BehaviorPredicate<InstanceBehaviorContext>
  draggable?: BehaviorPredicate<InstanceBehaviorContext>
  sortable?: BehaviorPredicate<InstanceBehaviorContext>
  deletable?: BehaviorPredicate<InstanceBehaviorContext>
  defaultLayout?: NodeLayout
  creatable?: CreatableBehaviorPredicate
  actions?: CoreWidgetActionConfig
}

export type WidgetMeta = CoreWidgetMeta
export type WidgetActionConfig = CoreWidgetActionConfig
```

Add `CoreWidgetActionConfig` and `CoreWidgetMeta` to `packages/core/src/index.ts` type exports.

- [ ] **Step 4: Remove unnecessary core peer dependency if no runtime Vue import remains**

Check for runtime Vue imports in core:

```bash
rg "from 'vue'" packages/core/src
```

If core still imports `ref`, `shallowRef`, `toRaw`, or `triggerRef` from Vue in `schema-store.ts`, keep `vue` in `packages/core/package.json`. If only type imports remain, move Vue from `peerDependencies` to `devDependencies`. For the current codebase, keep the peer dependency because `schema-store.ts` uses Vue reactivity at runtime.

- [ ] **Step 5: Add renderer-specific metadata**

In `packages/renderer/src/types.ts`, import `CoreWidgetMeta`:

```ts
import type { CoreWidgetMeta, CreationBlockReason, DesignerEngine, DesignerSchema, LayoutPlan, RegistryInstance } from '@dragcraft/core'
```

Add:

```ts
export interface RendererWidgetActionExtra {
  key: string
  label: string
  icon?: string | Component
  type: 'button' | 'drag-handle'
  order: number
  risk?: ActionRisk
  metadata?: Record<string, unknown>
  visible?: (ctx: NodeActionContext) => boolean
  available?: (ctx: NodeActionContext) => boolean
  disabled?: (ctx: NodeActionContext) => boolean
  command?: (ctx: NodeActionContext, event: MouseEvent) => Command | null | undefined
  handler?: (ctx: NodeActionContext, event: MouseEvent) => MaybePromise<void>
  className?: string
}

export interface WidgetActionConfig {
  only?: string[]
  exclude?: string[]
  extra?: RendererWidgetActionExtra[]
}

export interface RendererWidgetMeta extends CoreWidgetMeta {
  actions?: WidgetActionConfig
  wrapper?: Component
}
```

The imports needed by that snippet are:

```ts
import type { Command } from '@dragcraft/core'
import type { NodeActionContext } from './action-registry'
import type { ActionRisk } from './action-runtime'
import type { MaybePromise } from './event-hooks'
```

- [ ] **Step 6: Cast registry metadata at renderer boundaries**

In `packages/renderer/src/action-registry.ts`, import and use `RendererWidgetMeta`:

```ts
import type { RendererWidgetMeta } from './types'
```

Change `NodeActionContext.meta`:

```ts
  meta: RendererWidgetMeta | undefined
```

In `packages/renderer/src/composables/useWidgetNode.ts`, import and use `RendererWidgetMeta`:

```ts
import type { RendererWidgetMeta } from '../types'
```

Change the `meta` computed type:

```ts
  meta: ComputedRef<RendererWidgetMeta | undefined>
```

and compute it with:

```ts
  const meta = computed<RendererWidgetMeta | undefined>(() =>
    engine.registry.getWidget(getNode().type) as RendererWidgetMeta | undefined,
  )
```

- [ ] **Step 7: Keep widgets package generic**

In `packages/widgets/src/types.ts`, import `CoreWidgetMeta` and make the definition generic:

```ts
import type { CoreWidgetMeta } from '@dragcraft/core'
import type { Component } from 'vue'

export interface WidgetDefinition<Meta extends CoreWidgetMeta = CoreWidgetMeta> {
  meta: Meta
  component: Component
}
```

- [ ] **Step 8: Run typecheck and tests**

Run:

```bash
pnpm typecheck
pnpm -F @dragcraft/renderer test -- action-registry.test.ts useWidgetNode.test.ts
pnpm -F @dragcraft/widgets test
```

Expected: typecheck passes and targeted tests pass.

- [ ] **Step 9: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/index.ts packages/core/package.json packages/renderer/src/types.ts packages/renderer/src/action-registry.ts packages/renderer/src/composables/useWidgetNode.ts packages/renderer/src/action-registry.test.ts packages/widgets/src/types.ts packages/widgets/src/index.test.ts
git commit -m "refactor(core): separate renderer widget metadata"
```

---

### Task 5: Extract Property Binding Translation

**Files:**
- Create: `packages/designer/src/bindings/field-binding.ts`
- Create: `packages/designer/src/bindings/field-binding.test.ts`
- Modify: `packages/designer/src/composables/usePropertyBinding.ts`
- Modify: `packages/designer/src/index.ts`
- Test: `packages/designer/src/composables/usePropertyBinding.test.ts`

**Interfaces:**
- Consumes: `FieldSchema['bindTo']`, `DesignerSchema`, `SchemaNode | null`, `Command`.
- Produces:
  - `resolveFieldBinding(binding, fallback): ResolvedFieldBinding`
  - `readBindingValue(binding, schema, node): unknown`
  - `createBindingCommand(binding, value, nodeId?): Command | null`

- [ ] **Step 1: Write failing pure binding tests**

Create `packages/designer/src/bindings/field-binding.test.ts`:

```ts
import type { DesignerSchema, SchemaNode } from '@dragcraft/core'
import { CommandType } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { createBindingCommand, readBindingValue, resolveFieldBinding } from './field-binding'

function makeSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: { theme: 'light' },
    root: {
      id: 'root',
      type: 'root',
      props: {},
      style: { surface: { backgroundColor: '#fff' } },
      children: [],
    },
  }
}

function makeNode(): SchemaNode {
  return {
    id: 'a',
    type: 'text',
    props: { title: 'Hello' },
    style: { container: { marginTop: 8 } },
  }
}

describe('field-binding', () => {
  it('resolves string bindings against the fallback scope', () => {
    expect(resolveFieldBinding('style.container.marginTop', { scope: 'node', path: 'props.marginTop' })).toEqual({
      scope: 'node',
      path: 'style.container.marginTop',
    })
  })

  it('reads values from node, schema, and globalConfig scopes', () => {
    const schema = makeSchema()
    const node = makeNode()

    expect(readBindingValue({ scope: 'node', path: 'props.title' }, schema, node)).toBe('Hello')
    expect(readBindingValue({ scope: 'node', path: 'style.container.marginTop' }, schema, node)).toBe(8)
    expect(readBindingValue({ scope: 'schema', path: 'root.style.surface.backgroundColor' }, schema, null)).toBe('#fff')
    expect(readBindingValue({ scope: 'globalConfig', path: 'theme' }, schema, null)).toBe('light')
  })

  it('creates UPDATE_PROPS commands for node props and styles', () => {
    expect(createBindingCommand({ scope: 'node', path: 'props.title' }, 'World', 'a')).toEqual({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'a', props: { title: 'World' } },
    })

    expect(createBindingCommand({ scope: 'node', path: 'style.container.marginTop' }, 12, 'a')).toEqual({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'a', props: {}, style: { container: { marginTop: 12 } } },
    })
  })

  it('creates schema-root and globalConfig commands', () => {
    expect(createBindingCommand({ scope: 'schema', path: 'root.style.surface.backgroundColor' }, '#f5f5f5')).toEqual({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'root', props: {}, style: { surface: { backgroundColor: '#f5f5f5' } } },
    })

    expect(createBindingCommand({ scope: 'globalConfig', path: 'theme' }, 'dark')).toEqual({
      type: CommandType.SET_GLOBAL_CONFIG,
      payload: { config: { theme: 'dark' } },
    })
  })

  it('returns null for unsupported or unsafe paths', () => {
    expect(createBindingCommand({ scope: 'node', path: 'layout.order' }, 1, 'a')).toBeNull()
    expect(createBindingCommand({ scope: 'schema', path: 'root.__proto__.polluted' }, true)).toBeNull()
    expect(createBindingCommand({ scope: 'node', path: 'props.title' }, 'World')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm -F @dragcraft/designer test -- field-binding.test.ts
```

Expected: FAIL with an import resolution error because `field-binding.ts` does not exist.

- [ ] **Step 3: Implement the binding helper**

Create `packages/designer/src/bindings/field-binding.ts`:

```ts
import type { Command } from '@dragcraft/core'
import type { FieldBindingScope, FieldBindingTarget } from '@dragcraft/form-generator'
import type { DesignerSchema, SchemaNode } from '@dragcraft/core'
import { CommandType } from '@dragcraft/core'

export type FieldBinding = string | FieldBindingTarget | undefined

export interface ResolvedFieldBinding {
  scope: FieldBindingScope
  path: string
}

const BLOCKED_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])

export function toPathSegments(path: string): string[] {
  return path
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean)
}

function isSafePath(path: string): boolean {
  return toPathSegments(path).every(segment => !BLOCKED_PATH_SEGMENTS.has(segment))
}

function safePathSegments(path: string): string[] {
  if (!isSafePath(path))
    return []
  return toPathSegments(path)
}

function splitHead(path: string): [string | undefined, string] {
  const segments = safePathSegments(path)
  const [head, ...rest] = segments
  return [head, rest.join('.')]
}

function setPatchPath(path: string, value: unknown): Record<string, unknown> | null {
  const segments = safePathSegments(path)
  if (segments.length === 0)
    return null

  const root: Record<string, unknown> = {}
  let cursor = root
  for (let i = 0; i < segments.length - 1; i++) {
    const next: Record<string, unknown> = {}
    cursor[segments[i]] = next
    cursor = next
  }
  cursor[segments[segments.length - 1]] = value
  return root
}

export function resolveFieldBinding(
  binding: FieldBinding,
  fallback: ResolvedFieldBinding,
): ResolvedFieldBinding {
  if (typeof binding === 'string')
    return { scope: fallback.scope, path: binding }
  if (binding)
    return { scope: binding.scope ?? fallback.scope, path: binding.path }
  return fallback
}

export function readPath(source: unknown, path: string): unknown {
  let current = source
  for (const segment of safePathSegments(path)) {
    if (typeof current !== 'object' || current === null)
      return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

export function readBindingValue(
  binding: ResolvedFieldBinding,
  schema: DesignerSchema,
  node: SchemaNode | null,
): unknown {
  if (binding.scope === 'globalConfig')
    return readPath(schema.globalConfig, binding.path)
  if (binding.scope === 'schema')
    return readPath(schema, binding.path)
  return node ? readPath(node, binding.path) : undefined
}

function createNodeBindingCommand(nodeId: string, path: string, value: unknown): Command | null {
  const [head, rest] = splitHead(path)
  if (head === 'props') {
    const props = setPatchPath(rest, value)
    return props
      ? { type: CommandType.UPDATE_PROPS, payload: { nodeId, props } }
      : null
  }
  if (head === 'style') {
    const style = setPatchPath(rest, value)
    return style
      ? { type: CommandType.UPDATE_PROPS, payload: { nodeId, props: {}, style } }
      : null
  }
  return null
}

export function createBindingCommand(
  binding: ResolvedFieldBinding,
  value: unknown,
  nodeId?: string,
): Command | null {
  if (!isSafePath(binding.path))
    return null

  if (binding.scope === 'globalConfig') {
    const config = setPatchPath(binding.path, value)
    return config
      ? { type: CommandType.SET_GLOBAL_CONFIG, payload: { config } }
      : null
  }

  if (binding.scope === 'schema') {
    const [head, rest] = splitHead(binding.path)
    if (head === 'globalConfig') {
      const config = setPatchPath(rest, value)
      return config
        ? { type: CommandType.SET_GLOBAL_CONFIG, payload: { config } }
        : null
    }
    if (head === 'root')
      return createNodeBindingCommand('root', rest, value)
    return null
  }

  return nodeId ? createNodeBindingCommand(nodeId, binding.path, value) : null
}
```

- [ ] **Step 4: Refactor usePropertyBinding to consume the helper**

In `packages/designer/src/composables/usePropertyBinding.ts`, remove local implementations of:

```ts
toPathSegments
readPath
setPatchPath
resolveBinding
readBindingValue
splitHead
dispatchNodeBinding
dispatchSchemaBinding
dispatchBinding
```

Import the helper:

```ts
import { createBindingCommand, readBindingValue, resolveFieldBinding } from '../bindings/field-binding'
```

Replace calls to `resolveBinding(...)` with:

```ts
resolveFieldBinding(...)
```

Replace the old `dispatchBinding` body with:

```ts
  function dispatchBinding(
    binding: ResolvedBinding,
    value: unknown,
    nodeId?: string,
  ): void {
    const command = createBindingCommand(binding, value, nodeId)
    if (!command) {
      console.warn(`[dragcraft/designer] Unsupported binding path "${binding.path}"`)
      return
    }
    engine.execute(command)
  }
```

Keep the local alias:

```ts
type ResolvedBinding = ReturnType<typeof resolveFieldBinding>
```

- [ ] **Step 5: Export the pure helpers for advanced tests and integrations**

In `packages/designer/src/index.ts`, add:

```ts
export {
  createBindingCommand,
  readBindingValue,
  resolveFieldBinding,
} from './bindings/field-binding'
export type { FieldBinding, ResolvedFieldBinding } from './bindings/field-binding'
```

- [ ] **Step 6: Run targeted tests**

Run:

```bash
pnpm -F @dragcraft/designer test -- field-binding.test.ts usePropertyBinding.test.ts
pnpm typecheck
```

Expected: all targeted tests and typecheck pass.

- [ ] **Step 7: Commit**

```bash
git add packages/designer/src/bindings/field-binding.ts packages/designer/src/bindings/field-binding.test.ts packages/designer/src/composables/usePropertyBinding.ts packages/designer/src/index.ts
git commit -m "refactor(designer): extract field binding translation"
```

---

### Task 6: Synchronize Architecture Documentation

**Files:**
- Modify: `README.md`
- Modify: `.github/architecture/01-overview.md`
- Modify: `.github/architecture/03-designer-and-renderer.md`
- Modify: `.github/architecture/04-form-and-configuration.md`
- Modify: `.github/architecture/06-themes-and-device-frames.md`
- Modify: `.github/architecture/07-package-reference.md`
- Modify: `.github/architecture/README.md`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**
- Consumes: final code shape from Tasks 1-5.
- Produces: architecture docs that match the implemented package boundaries and public APIs.

- [ ] **Step 1: Update the overview with enforced command semantics**

In `.github/architecture/01-overview.md`, replace the Runtime consistency bullet:

```md
- Runtime 一致性：schema 写操作必须通过 core command；无效或被拒绝的命令不写入 history，也不触发 `schema:changed`。
```

In the Core Engine section, add:

```md
`engine.state` 是对外读取 schema 与运行时状态的安全入口，返回 clone 或快照；`engine.store` 保留给内部命令、历史和迁移流程使用，不作为业务侧写入入口。
```

- [ ] **Step 2: Update Core documentation**

In `.github/architecture/02-schema-and-core.md`, update `CommandBus` flow to:

```text
engine.execute({ type, payload })
  -> CommandBus
  -> cloneDeep before snapshot
  -> handler(ctx, payload) mutates raw schema or returns false
  -> if false: rollback and stop without history/events
  -> if changed: push before snapshot to history
  -> store.triggerUpdate()
  -> eventHub.emit()
```

In the `SchemaStore` section, replace the `getRawSchema()` bullet with:

```md
- `getRawSchema()`：内部命令处理器使用的原始 schema 引用；业务侧应使用 `engine.state.getSchema()`。
```

Add a new `EngineState` subsection:

```md
### EngineState

`engine.state` 是公开读取 facade：

- `getSchema()`：返回当前 schema 深拷贝。
- `getNodeById(id)`：返回节点快照，调用方修改不会影响内部 schema。
- `getSelectedNodeId()`、`getHoveredNodeId()`、`getDragTarget()`：返回运行时交互状态快照。

UI 层读取 schema 时优先使用 `engine.state`。只有 core 内部命令、history 和 migration 可以读取 raw schema。
```

- [ ] **Step 3: Update Designer and Renderer documentation**

In `.github/architecture/03-designer-and-renderer.md`, add an API stability note after the Designer API section:

```md
### Public API 分级

`@dragcraft/designer` 默认出口保留标准接入面：`createDesigner`、`DcDesigner`、`useDesigner`、核心 schema/command 类型、字段 schema 类型和常用 renderer 扩展类型。直接访问 `engine.store`、renderer 内部 composable 或 action registry 属于高级集成能力；业务侧应优先使用 `engine.state` 和 `engine.execute()`。
```

In the renderer boundary section, replace:

```md
- 不直接修改 schema。
```

with:

```md
- 不直接修改 schema；读取 schema 使用 `engine.state`，写入必须执行 core command。
```

- [ ] **Step 4: Update FormSchema documentation**

In `.github/architecture/04-form-and-configuration.md`, replace the `FieldSchema` snippet with:

```ts
interface FieldSchema {
  key: string
  label: string
  labelKey?: string
  placeholderKey?: string
  optionKeyPrefix?: string
  component: string
  bindTo?: string | { scope?: 'node' | 'schema' | 'globalConfig', path: string }
  componentProps?: Record<string, unknown> | ((ctx: FormContext) => Record<string, unknown>)
  dependencies?: {
    fields: string[]
    handler: (form: Record<string, unknown>, fieldValue: unknown) => Partial<FieldSchema>
  }
  show?: boolean | ((ctx: FormContext) => boolean)
  ifShow?: boolean | ((ctx: FormContext) => boolean)
  parseValue?: (value: unknown, ctx: FormContext) => unknown
  valueFormat?: (value: unknown, ctx: FormContext) => unknown
  defaultValue?: unknown
  visible?: (ctx: FormContext) => boolean
  disabled?: (ctx: FormContext) => boolean
  rules?: ValidationRule[]
  tooltip?: string
  span?: number
}
```

Add this paragraph below the snippet:

```md
`visible` 和 `ifShow` 控制字段是否渲染；`ifShow` 优先，`visible` 保留为语义化别名。`show` 控制 CSS 隐藏并保留 DOM 状态。`parseValue` 处理 input -> model，`valueFormat` 处理 model -> input。`dependencies` 可根据其他字段值返回字段 schema 覆盖，但不能改变 `key`、`component` 或 `dependencies` 本身。
```

- [ ] **Step 5: Correct device-frames dependency documentation**

In `.github/architecture/06-themes-and-device-frames.md`, replace:

```md
- 不依赖 designer 或 renderer，仅依赖 Vue。
```

with:

```md
- 不依赖 designer 或 renderer；依赖 Vue、`@dragcraft/core` 的 layout/schema 类型，以及 `@dragcraft/icons` 的设备切换图标。
```

In `.github/architecture/07-package-reference.md`, replace the device-frames dependency line:

```md
- 仅依赖 Vue。
```

with:

```md
- 依赖 Vue、`@dragcraft/core` layout/schema 类型和 `@dragcraft/icons`，不依赖 designer 或 renderer。
```

- [ ] **Step 6: Resolve docs workspace drift**

If `docs/` still contains only `docs/superpowers/plans`, keep the workspace entry because the plan directory now exists. If the team wants architecture docs under `docs/architecture`, move `.github/architecture` in a separate documentation-only change. For this task, leave `pnpm-workspace.yaml` unchanged unless an execution-time check shows `docs/package.json` is required by pnpm.

Run this check:

```bash
pnpm -r list --depth -1
```

Expected: command completes successfully. If pnpm warns that `docs` is not a package, remove the `docs` line from `pnpm-workspace.yaml`:

```yaml
packages:
  - playground
  - packages/*
  - packages/fields/*
  - examples/*
```

- [ ] **Step 7: Run documentation consistency checks**

Run:

```bash
rg "仅依赖 Vue" README.md .github/architecture
pnpm typecheck
```

Expected: `rg` finds no matches for `仅依赖 Vue`; `pnpm typecheck` passes.

- [ ] **Step 8: Commit**

```bash
git add README.md .github/architecture/01-overview.md .github/architecture/02-schema-and-core.md .github/architecture/03-designer-and-renderer.md .github/architecture/04-form-and-configuration.md .github/architecture/06-themes-and-device-frames.md .github/architecture/07-package-reference.md .github/architecture/README.md pnpm-workspace.yaml
git commit -m "docs: align architecture docs with implementation"
```

---

## Final Verification

- [ ] Run all unit tests:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] Run typecheck:

```bash
pnpm typecheck
```

Expected: TypeScript exits successfully.

- [ ] Run lint:

```bash
pnpm lint
```

Expected: ESLint exits successfully.

- [ ] Run build:

```bash
pnpm build
```

Expected: Turborepo builds all packages successfully and writes package `dist/**` outputs.

## Self-Review

- Spec coverage: Tasks 1 and 3 cover command/state write boundaries; Task 4 covers core/UI coupling; Task 5 covers data-layer binding translation; Task 6 covers docs drift and package responsibility descriptions.
- Placeholder scan: The plan contains no unresolved placeholder instructions and no unspecified implementation steps.
- Type consistency: `CommandResult`, `EngineState`, `CoreWidgetMeta`, `RendererWidgetMeta`, `ResolvedFieldBinding`, and `createBindingCommand` are introduced before later tasks reference them.
