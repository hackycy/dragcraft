import type { CommandContext, ContainerDefinition, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { moveNodeHandler } from './move-node'

function makeNode(id: string, layout?: SchemaNode['layout']): SchemaNode {
  return { id, type: 'text', props: {}, layout }
}

function makeLockedNode(id: string): SchemaNode {
  return { ...makeNode(id), type: 'locked' }
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function setup(children: SchemaNode[]) {
  const store = createSchemaStore(makeSchema(children))
  const registry = createRegistry()
  const ctx: CommandContext = { store, registry }
  return { store, registry, ctx }
}

const constrainedDefinition: ContainerDefinition = {
  defaultVariant: 'split',
  variants: {
    split: {
      title: 'Split',
      regions: [
        { id: 'required', title: 'Required', constraints: { minItems: 1 } },
        { id: 'full', title: 'Full', constraints: { maxItems: 1 } },
        { id: 'open', title: 'Open' },
      ],
    },
  },
}

function makeContainer(regions?: Record<string, SchemaNode[]>): SchemaNode {
  return {
    id: 'layout',
    type: 'split-layout',
    props: {},
    container: {
      variant: 'split',
      regions: regions ?? { required: [], full: [], open: [] },
    },
  }
}

function setupWithContainer(rootNodes: SchemaNode[]) {
  const result = setup(rootNodes)
  result.registry.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
  })
  result.registry.registerWidget({
    type: 'locked',
    title: 'Locked',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    sortable: false,
  })
  result.registry.registerWidget({
    type: 'split-layout',
    title: 'Split',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    container: constrainedDefinition,
  })
  return result
}

describe('moveNodeHandler', () => {
  it('moves node from one position to another', () => {
    const { ctx, store } = setup([makeNode('a'), makeNode('b'), makeNode('c')])
    moveNodeHandler(ctx, { nodeId: 'a', destination: { kind: 'root', index: 3 } })
    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  it('moves node to same position (no-op)', () => {
    const { ctx, store } = setup([makeNode('a'), makeNode('b')])
    moveNodeHandler(ctx, { nodeId: 'a', destination: { kind: 'root', index: 0 } })
    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['a', 'b'])
  })

  it('does nothing when node not found', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, store } = setup([makeNode('a')])
    moveNodeHandler(ctx, { nodeId: 'missing', destination: { kind: 'root', index: 0 } })
    expect(store.getRawSchema().root.children).toHaveLength(1)
    warn.mockRestore()
  })

  it('does nothing when children is undefined', () => {
    const { ctx, store } = setup([])
    store.getRawSchema().root.children = undefined as any
    moveNodeHandler(ctx, { nodeId: 'a', destination: { kind: 'root', index: 0 } })
    // Should not throw
  })

  it('blocks move when sortable constraint violated (moving locked widget)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, registry, store } = setup([makeNode('a'), makeNode('b')])
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    // Both are locked (sortable=false). Moving 'a' should be blocked.
    moveNodeHandler(ctx, { nodeId: 'a', destination: { kind: 'root', index: 2 } })
    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['a', 'b']) // unchanged
    warn.mockRestore()
  })

  it('moves nodes by sort-scope index while preserving chrome nodes', () => {
    const { ctx, store } = setup([
      makeNode('a'),
      makeNode('tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }),
      makeNode('b'),
      makeNode('c'),
    ])

    moveNodeHandler(ctx, { nodeId: 'a', destination: { kind: 'root', index: 3 } })

    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['tabbar', 'b', 'c', 'a'])
  })

  it('blocks moving nodes outside sortable scopes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, store } = setup([
      makeNode('a'),
      makeNode('tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }),
    ])

    moveNodeHandler(ctx, { nodeId: 'tabbar', destination: { kind: 'root', index: 0 } })

    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['a', 'tabbar'])
    warn.mockRestore()
  })

  it('moves a root widget into a region and strips page placement', () => {
    const text = makeNode('text', { placement: { kind: 'flow', region: 'hero' }, order: 3 })
    const { ctx, store } = setupWithContainer([text, makeContainer()])

    const result = moveNodeHandler(ctx, {
      nodeId: 'text',
      destination: { kind: 'container', containerId: 'layout', regionId: 'open', index: 0 },
    })

    expect(result).toMatchObject({ ok: true })
    expect(store.getRawSchema().root.children!.map(node => node.id)).toEqual(['layout'])
    expect(store.getRawSchema().root.children![0].container!.regions.open[0]).toMatchObject({
      id: 'text',
      layout: {},
    })
  })

  it('rejects a structurally invalid final move candidate without mutation', () => {
    const invalid = { id: 'invalid', type: 'text', props: null } as unknown as SchemaNode
    const { ctx, store } = setupWithContainer([invalid, makeContainer()])
    const before = store.getSchema()

    const result = moveNodeHandler(ctx, {
      nodeId: 'invalid',
      destination: { kind: 'container', containerId: 'layout', regionId: 'open', index: 0 },
    })

    expect(result).toMatchObject({ ok: false, code: 'SCHEMA_CANDIDATE_INVALID' })
    expect(store.getSchema()).toEqual(before)
  })

  it('moves between regions atomically and honors source minItems', () => {
    const container = makeContainer({
      required: [makeNode('required')],
      full: [],
      open: [],
    })
    const { ctx, store } = setupWithContainer([container])
    const before = store.getSchema()

    const result = moveNodeHandler(ctx, {
      nodeId: 'required',
      destination: { kind: 'container', containerId: 'layout', regionId: 'full', index: 0 },
    })

    expect(result).toMatchObject({ ok: false, code: 'CONTAINER_REGION_MIN_ITEMS' })
    expect(store.getSchema()).toEqual(before)
  })

  it('moves between regions atomically and honors target maxItems', () => {
    const container = makeContainer({
      required: [makeNode('required'), makeNode('spare')],
      full: [makeNode('occupied')],
      open: [],
    })
    const { ctx, store } = setupWithContainer([container])
    const before = store.getSchema()

    const result = moveNodeHandler(ctx, {
      nodeId: 'spare',
      destination: { kind: 'container', containerId: 'layout', regionId: 'full', index: 0 },
    })

    expect(result).toMatchObject({ ok: false, code: 'CONTAINER_REGION_MAX_ITEMS' })
    expect(store.getSchema()).toEqual(before)
  })

  it('reorders inside a region using pre-removal insertion boundaries', () => {
    const container = makeContainer({
      required: [makeNode('required')],
      full: [],
      open: [makeNode('a'), makeNode('b'), makeNode('c')],
    })
    const { ctx, store } = setupWithContainer([container])

    const result = moveNodeHandler(ctx, {
      nodeId: 'a',
      destination: { kind: 'container', containerId: 'layout', regionId: 'open', index: 3 },
    })

    expect(result).toMatchObject({ ok: true })
    expect(store.getRawSchema().root.children![0].container!.regions.open.map(node => node.id))
      .toEqual(['b', 'c', 'a'])
  })

  it('rejects a same-region move across an absolute-index lock', () => {
    const container = makeContainer({
      required: [makeNode('required')],
      full: [],
      open: [makeNode('a'), makeLockedNode('locked'), makeNode('b')],
    })
    const { ctx, store } = setupWithContainer([container])
    const before = store.getSchema()

    const result = moveNodeHandler(ctx, {
      nodeId: 'a',
      destination: { kind: 'container', containerId: 'layout', regionId: 'open', index: 3 },
    })

    expect(result).toEqual({ ok: false, code: 'SORTABLE_LOCK_VIOLATION' })
    expect(store.getSchema()).toEqual(before)
  })

  it('rejects cross-owner moves that shift source or target region locks', () => {
    const sourceLocked = makeContainer({
      required: [makeNode('required')],
      full: [],
      open: [makeNode('source'), makeLockedNode('source-lock')],
    })
    const sourceSetup = setupWithContainer([sourceLocked])
    const sourceBefore = sourceSetup.store.getSchema()
    expect(moveNodeHandler(sourceSetup.ctx, {
      nodeId: 'source',
      destination: { kind: 'root', index: 1 },
    })).toEqual({ ok: false, code: 'SORTABLE_LOCK_VIOLATION' })
    expect(sourceSetup.store.getSchema()).toEqual(sourceBefore)

    const targetLocked = makeContainer({
      required: [makeNode('required')],
      full: [],
      open: [makeLockedNode('target-lock')],
    })
    const targetSetup = setupWithContainer([makeNode('source'), targetLocked])
    const targetBefore = targetSetup.store.getSchema()
    expect(moveNodeHandler(targetSetup.ctx, {
      nodeId: 'source',
      destination: { kind: 'container', containerId: 'layout', regionId: 'open', index: 0 },
    })).toEqual({ ok: false, code: 'SORTABLE_LOCK_VIOLATION' })
    expect(targetSetup.store.getSchema()).toEqual(targetBefore)
  })

  it('moves a region widget back to root', () => {
    const container = makeContainer({
      required: [makeNode('required')],
      full: [],
      open: [makeNode('child')],
    })
    const { ctx, store } = setupWithContainer([container])

    const result = moveNodeHandler(ctx, {
      nodeId: 'child',
      destination: { kind: 'root', index: 1 },
    })

    expect(result).toMatchObject({ ok: true })
    expect(store.getRawSchema().root.children!.map(node => node.id)).toEqual(['layout', 'child'])
    expect(store.getRawSchema().root.children![0].container!.regions.open).toEqual([])
  })

  it('moves an unsorted region widget to a raw root index without content locks', () => {
    const child = makeNode('child', { placement: { kind: 'chrome', edge: 'block-end' } })
    const container = makeContainer({
      required: [makeNode('required')],
      full: [],
      open: [child],
    })
    const locked = { ...makeNode('locked'), type: 'locked' }
    const { ctx, registry, store } = setupWithContainer([locked, container])
    registry.registerWidget({
      type: 'locked',
      title: 'Locked',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      sortable: false,
    })

    const result = moveNodeHandler(ctx, {
      nodeId: 'child',
      destination: { kind: 'root', index: 0 },
    })

    expect(result).toMatchObject({ ok: true })
    expect(store.getRawSchema().root.children!.map(node => node.id)).toEqual(['child', 'locked', 'layout'])
    expect(store.getRawSchema().root.children![0].layout?.placement).toEqual({
      kind: 'chrome',
      edge: 'block-end',
    })
  })

  it('rejects moving from an unresolved source variant without mutation', () => {
    const container = makeContainer({
      required: [],
      full: [],
      open: [makeNode('child')],
    })
    container.container!.variant = 'missing'
    const { ctx, store } = setupWithContainer([container])
    const before = store.getSchema()

    const result = moveNodeHandler(ctx, {
      nodeId: 'child',
      destination: { kind: 'root', index: 1 },
    })

    expect(result).toEqual({ ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' })
    expect(store.getSchema()).toEqual(before)
  })

  it('rejects moving from an unresolved source region without mutation', () => {
    const container = makeContainer({
      required: [],
      full: [],
      open: [],
      legacy: [makeNode('child')],
    })
    const { ctx, store } = setupWithContainer([container])
    const before = store.getSchema()

    const result = moveNodeHandler(ctx, {
      nodeId: 'child',
      destination: { kind: 'root', index: 1 },
    })

    expect(result).toEqual({ ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' })
    expect(store.getSchema()).toEqual(before)
  })
})
