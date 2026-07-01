# Type Safety & Architecture Robustness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate type safety gaps and add runtime robustness across `utils`, `core`, `designer`, and `builtin-fields` packages.

**Architecture:** Six surgical changes: replace untyped `Function` in EventEmitter, remove double-cast assertions via registry type additions, add try/catch error recovery to command bus, add runtime validation to widget registration, rename `patchNode` to `applyTransientPatch`. Each change is independently verifiable.

**Tech Stack:** TypeScript (strict mode), Vitest, Vue 3, pnpm monorepo

## Global Constraints

- `structuredClone` is prohibited (CLAUDE.md)
- Unicode character emojis are prohibited (CLAUDE.md)
- Each package imports through pnpm workspace (CLAUDE.md)
- `pnpm build`, `pnpm lint`, `pnpm typecheck` must pass after each task (CLAUDE.md)
- No compatibility shims, migration wording, or aliases (CLAUDE.md)

---

### Task 1: EventEmitter Type Safety

**Files:**
- Modify: `packages/utils/src/event-emitter.ts:1,4,6,13,37`
- Modify: `packages/core/src/event-hub.ts:4`

**Interfaces:**
- Produces: `EventEmitter` with `(...args: unknown[]) => void` listener type
- Produces: `EventHub` with `EventListener = (...args: unknown[]) => void`

- [ ] **Step 1: Update EventEmitter types**

In `packages/utils/src/event-emitter.ts`:
- Remove line 1: `/* eslint-disable ts/no-unsafe-function-type */`
- Replace all 4 occurrences of `Function` with `(...args: unknown[]) => void` (lines 4, 6, 13, 37)

The file should become:

```ts
export class EventEmitter {
  private events: Map<string, ((...args: unknown[]) => void)[]> = new Map()

  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args)
        }
        catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  once(event: string, listener: (...args: unknown[]) => void): void {
    const wrapper = (...args: unknown[]): void => {
      listener(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  clear(): void {
    this.events.clear()
  }
}
```

- [ ] **Step 2: Update EventHub EventListener type**

In `packages/core/src/event-hub.ts`, line 4, change:

```ts
export type EventListener = (...args: any[]) => void
```

to:

```ts
export type EventListener = (...args: unknown[]) => void
```

- [ ] **Step 3: Verify typecheck, build, lint, and tests pass**

Run:
```bash
pnpm typecheck && pnpm build && pnpm lint && pnpm test
```

Expected: All pass. No test changes needed -- `vi.fn()` returns `(...args: any[]) => any` which is assignable to `(...args: unknown[]) => void`.

- [ ] **Step 4: Commit**

```bash
git add packages/utils/src/event-emitter.ts packages/core/src/event-hub.ts
git commit -m "fix(utils,core): replace untyped Function with typed listener signature"
```

---

### Task 2: Rename `patchNode` to `applyTransientPatch`

**Files:**
- Modify: `packages/core/src/types.ts:297`
- Modify: `packages/core/src/schema-store.ts:77,111`
- Modify: `packages/core/src/schema-store.test.ts:104,106,110,112,116,118`
- Modify: `packages/core/README.md:104`

**Interfaces:**
- Produces: `SchemaStoreInstance.applyTransientPatch(nodeId: string, partial: Partial<Pick<SchemaNode, 'props' | 'style'>>) => void`

- [ ] **Step 1: Update the type definition**

In `packages/core/src/types.ts`, line 297, change:

```ts
patchNode: (nodeId: string, partial: Partial<Pick<SchemaNode, 'props' | 'style'>>) => void
```

to:

```ts
applyTransientPatch: (nodeId: string, partial: Partial<Pick<SchemaNode, 'props' | 'style'>>) => void
```

- [ ] **Step 2: Update the implementation**

In `packages/core/src/schema-store.ts`, line 77, rename the function:

```ts
function applyTransientPatch(
```

Line 111, update the return object key:

```ts
applyTransientPatch,
```

- [ ] **Step 3: Update tests**

In `packages/core/src/schema-store.test.ts`, replace all 3 occurrences of `store.patchNode` with `store.applyTransientPatch` (lines 106, 112, 118).

Also update the test descriptions at lines 104, 110, 116:
- `'patchNode updates props'` -> `'applyTransientPatch updates props'`
- `'patchNode updates style'` -> `'applyTransientPatch updates style'`
- `'patchNode does nothing for missing node'` -> `'applyTransientPatch does nothing for missing node'`

- [ ] **Step 4: Update README**

In `packages/core/README.md`, line 104, change:

```
| `patchNode(nodeId, partial)` | 局部更新节点 props/style |
```

to:

```
| `applyTransientPatch(nodeId, partial)` | 局部更新节点 props/style（不触发历史快照和事件） |
```

- [ ] **Step 5: Verify typecheck, build, lint, and tests pass**

Run:
```bash
pnpm typecheck && pnpm build && pnpm lint && pnpm test
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/schema-store.ts packages/core/src/schema-store.test.ts packages/core/README.md
git commit -m "refactor(core): rename patchNode to applyTransientPatch for intent clarity"
```

---

### Task 3: Widget Registration Validation

**Files:**
- Modify: `packages/core/src/registry.ts:7-11`
- Modify: `packages/core/src/registry.test.ts`

**Interfaces:**
- Produces: `registerWidget(meta: WidgetMeta): void` with runtime validation for `type` and `title`

- [ ] **Step 1: Write failing tests**

In `packages/core/src/registry.test.ts`, add these test cases after the existing `'warns on duplicate registration'` test:

```ts
it('warns and skips when type is empty', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const reg = createRegistry()
  reg.registerWidget(makeMeta(''))
  expect(reg.getWidget('')).toBeUndefined()
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('must have a non-empty "type"'),
  )
  warn.mockRestore()
})

it('warns and skips when title is empty', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const reg = createRegistry()
  reg.registerWidget(makeMeta('button', { title: '' }))
  expect(reg.getWidget('button')).toBeUndefined()
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('must have a non-empty "title"'),
  )
  warn.mockRestore()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd packages/core && pnpm test -- --run registry.test.ts
```

Expected: The two new tests FAIL (currently no validation exists, so widgets with empty type/title are registered).

- [ ] **Step 3: Add validation to registerWidget**

In `packages/core/src/registry.ts`, add validation at the top of `registerWidget()` (after line 7):

```ts
function registerWidget(meta: WidgetMeta): void {
  if (!meta.type || typeof meta.type !== 'string') {
    console.warn('[dragcraft/core] registerWidget: widget meta must have a non-empty "type" string')
    return
  }
  if (!meta.title || typeof meta.title !== 'string') {
    console.warn(`[dragcraft/core] registerWidget: widget "${meta.type}" must have a non-empty "title" string`)
    return
  }
  // ... existing duplicate check and set logic
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd packages/core && pnpm test -- --run registry.test.ts
```

Expected: All tests PASS including the two new ones.

- [ ] **Step 5: Verify typecheck, build, lint pass**

Run:
```bash
pnpm typecheck && pnpm build && pnpm lint
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/registry.ts packages/core/src/registry.test.ts
git commit -m "feat(core): add runtime validation for widget type and title on registration"
```

---

### Task 4: Registry Type Additions

**Files:**
- Modify: `packages/core/src/types.ts:301-307`
- Modify: `packages/core/src/registry.ts`
- Modify: `packages/core/src/registry.test.ts`

**Interfaces:**
- Consumes: `FormSchemaShape` from `packages/core/src/types.ts:101-107`
- Produces: `RegistryInstance.registerGlobalConfigFormSchema(schema: FormSchemaShape): void`
- Produces: `RegistryInstance.getGlobalConfigSchema(): FormSchemaShape | Record<string, unknown> | undefined`

- [ ] **Step 1: Write failing test**

In `packages/core/src/registry.test.ts`, add after the existing `'registers and retrieves global config schema'` test:

```ts
it('registers and retrieves global config form schema', () => {
  const reg = createRegistry()
  expect(reg.getGlobalConfigSchema()).toBeUndefined()
  const formSchema = { sections: [{ title: 'General', fields: [] }] }
  reg.registerGlobalConfigFormSchema(formSchema)
  expect(reg.getGlobalConfigSchema()).toBe(formSchema)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd packages/core && pnpm test -- --run registry.test.ts
```

Expected: FAIL -- `registerGlobalConfigFormSchema` is not a function.

- [ ] **Step 3: Add method to RegistryInstance type**

In `packages/core/src/types.ts`, add to `RegistryInstance` (after line 303):

```ts
export interface RegistryInstance {
  registerWidget: (meta: WidgetMeta) => void
  registerGlobalConfigSchema: (schema: Record<string, unknown>) => void
  registerGlobalConfigFormSchema: (schema: FormSchemaShape) => void
  getWidget: (type: string) => WidgetMeta | undefined
  getGlobalConfigSchema: () => Record<string, unknown> | undefined
  getAllWidgets: () => WidgetMeta[]
}
```

- [ ] **Step 4: Implement the new method**

In `packages/core/src/registry.ts`, add the import for `FormSchemaShape` and the new method:

```ts
import type { FormSchemaShape, RegistryInstance, WidgetMeta } from './types'
```

Add the implementation after `registerGlobalConfigSchema`:

```ts
function registerGlobalConfigFormSchema(schema: FormSchemaShape): void {
  globalConfigSchema = schema as Record<string, unknown>
}
```

Add it to the return object:

```ts
return {
  registerWidget,
  registerGlobalConfigSchema,
  registerGlobalConfigFormSchema,
  getWidget,
  getGlobalConfigSchema,
  getAllWidgets,
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
cd packages/core && pnpm test -- --run registry.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Verify typecheck, build, lint pass**

Run:
```bash
pnpm typecheck && pnpm build && pnpm lint
```

Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/registry.ts packages/core/src/registry.test.ts
git commit -m "feat(core): add registerGlobalConfigFormSchema to RegistryInstance"
```

---

### Task 5: Remove Double-Cast Assertions

**Files:**
- Modify: `packages/designer/src/factory.ts:54-58`
- Modify: `packages/designer/src/composables/usePropertyBinding.ts:56`
- Modify: `packages/builtin-fields/src/fields/ArrayField.ts:37`

**Interfaces:**
- Consumes: `RegistryInstance.registerGlobalConfigFormSchema(schema: FormSchemaShape)` from Task 4
- Consumes: `FormSchemaShape` from `@dragcraft/core`

- [ ] **Step 1: Fix factory.ts double-cast**

In `packages/designer/src/factory.ts`, lines 54-58, change:

```ts
if (globalConfigSchema) {
  engine.registry.registerGlobalConfigSchema(
    globalConfigSchema as unknown as Record<string, unknown>,
  )
}
```

to:

```ts
if (globalConfigSchema) {
  engine.registry.registerGlobalConfigFormSchema(globalConfigSchema)
}
```

- [ ] **Step 2: Fix usePropertyBinding.ts double-cast**

In `packages/designer/src/composables/usePropertyBinding.ts`, line 56, change:

```ts
return meta.formSchema as unknown as FormSchema
```

to:

```ts
return meta.formSchema as FormSchema
```

- [ ] **Step 3: Fix ArrayField.ts double-cast**

In `packages/builtin-fields/src/fields/ArrayField.ts`, line 37, change:

```ts
const config = computed(() => (props.field.props || {}) as unknown as ArrayFieldConfig)
```

to:

```ts
const config = computed(() => (props.field.props || {}) as ArrayFieldConfig)
```

- [ ] **Step 4: Verify typecheck, build, lint, and tests pass**

Run:
```bash
pnpm typecheck && pnpm build && pnpm lint && pnpm test
```

Expected: All pass. If any single `as` cast fails to compile (due to structural distance), keep the `unknown` intermediate and add a brief comment: `// double cast needed: types are structurally compatible but not directly assignable`.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/factory.ts packages/designer/src/composables/usePropertyBinding.ts packages/builtin-fields/src/fields/ArrayField.ts
git commit -m "fix(designer,builtin-fields): remove double-cast type assertions"
```

---

### Task 6: Command Bus Error Recovery

**Files:**
- Modify: `packages/core/src/command-bus.ts:44-63`
- Modify: `packages/core/src/command-bus.test.ts`

**Interfaces:**
- Produces: `execute<T>(command: Command<T>): void` with try/catch rollback on handler failure

- [ ] **Step 1: Write failing tests**

In `packages/core/src/command-bus.test.ts`, add after the existing `'registerHandler overwrites previous handler'` test:

```ts
it('execute rolls back schema when handler throws', () => {
  const { commandBus, store } = setup(
    makeSchema([{ id: 'a', type: 'text', props: { label: 'original' } }]),
  )
  const originalSchema = store.getSchema()

  commandBus.registerHandler('FAILING', () => {
    // Mutate the schema before throwing
    store.getRawSchema().root.children[0].props.label = 'mutated'
    throw new Error('handler failed')
  })

  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  commandBus.execute({ type: 'FAILING', payload: null })

  // Schema should be restored to pre-command state
  expect(store.getSchema()).toEqual(originalSchema)
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringContaining('rolling back'),
    expect.any(Error),
  )
  errorSpy.mockRestore()
})

it('execute does not emit events when handler throws', () => {
  const { commandBus, eventHub } = setup()
  const schemaChanged = vi.fn()
  eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

  commandBus.registerHandler('FAILING', () => {
    throw new Error('handler failed')
  })

  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  commandBus.execute({ type: 'FAILING', payload: null })

  expect(schemaChanged).not.toHaveBeenCalled()
  errorSpy.mockRestore()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd packages/core && pnpm test -- --run command-bus.test.ts
```

Expected: The two new tests FAIL (no try/catch exists, schema is left mutated, events still fire).

- [ ] **Step 3: Add try/catch error recovery**

In `packages/core/src/command-bus.ts`, replace lines 44-63 (the `execute` function body) with:

```ts
function execute<T = unknown>(command: Command<T>): void {
  const handler = handlers.get(command.type)
  if (!handler) {
    console.warn(`[dragcraft/core] No handler registered for command type: "${command.type}"`)
    return
  }

  const beforeSnapshot = cloneDeep(toRaw(store.schema.value))
  history.pushSnapshot(command.type, beforeSnapshot)

  try {
    handler(ctx, command.payload)
  }
  catch (error) {
    store.setSchema(beforeSnapshot)
    console.error(`[dragcraft/core] Command "${command.type}" failed, rolling back:`, error)
    return
  }

  store.triggerUpdate()

  const specificEvent = COMMAND_EVENT_MAP[command.type]
  if (specificEvent) {
    eventHub.emit(specificEvent, command.payload)
  }
  eventHub.emit(EventName.SCHEMA_CHANGED, store.getSchema())
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd packages/core && pnpm test -- --run command-bus.test.ts
```

Expected: All tests PASS including the two new ones.

- [ ] **Step 5: Verify typecheck, build, lint pass**

Run:
```bash
pnpm typecheck && pnpm build && pnpm lint
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/command-bus.ts packages/core/src/command-bus.test.ts
git commit -m "feat(core): add try/catch error recovery to command bus execute"
```

---

### Final Verification

After all 6 tasks are complete, run the full verification suite:

```bash
pnpm typecheck && pnpm build && pnpm lint && pnpm test
```

Expected: All pass. The project is in a clean state with all type safety and robustness improvements applied.
