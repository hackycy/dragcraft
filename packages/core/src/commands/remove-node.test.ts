import type { CommandContext, ContainerDefinition, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { removeNodeHandler } from './remove-node'

function makeNode(id: string, layout?: SchemaNode['layout']): SchemaNode {
  return { id, type: 'text', props: {}, layout }
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function setup(children: SchemaNode[]) {
  const store = createSchemaStore(makeSchema(children))
  const registry = createRegistry()
  const ctx: CommandContext = { schema: store.getSnapshot(), draft: store.getSchema(), store, registry }
  return { store, registry, ctx }
}

const containerDefinition: ContainerDefinition = {
  defaultVariant: 'split',
  variants: {
    split: {
      title: 'Split',
      regions: [
        { id: 'required', title: 'Required', constraints: { minItems: 1 } },
        { id: 'open', title: 'Open' },
      ],
    },
  },
}

function makeContainer(regions: Record<string, SchemaNode[]>): SchemaNode {
  return {
    id: 'layout',
    type: 'split-layout',
    props: {},
    container: { variant: 'split', regions },
  }
}

function setupWithContainer(container: SchemaNode) {
  const result = setup([container])
  result.registry.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
  })
  result.registry.registerWidget({
    type: 'split-layout',
    title: 'Split',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    container: containerDefinition,
  })
  return result
}

describe('removeNodeHandler', () => {
  it('removes node by id', () => {
    const { ctx } = setup([makeNode('a'), makeNode('b')])
    removeNodeHandler(ctx, { nodeId: 'a' })
    expect(ctx.draft.root.children).toHaveLength(1)
    expect(ctx.draft.root.children![0].id).toBe('b')
  })

  it('warns when trying to remove root', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx } = setup([makeNode('a')])
    removeNodeHandler(ctx, { nodeId: 'root' })
    expect(ctx.draft.root.children).toHaveLength(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cannot remove root'))
    warn.mockRestore()
  })

  it('warns when node not found', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx } = setup([makeNode('a')])
    removeNodeHandler(ctx, { nodeId: 'missing' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not found'))
    warn.mockRestore()
  })

  it('clears selectedNodeId when removing selected node', () => {
    const { ctx, store } = setup([makeNode('a'), makeNode('b')])
    store.selectNode('a')
    removeNodeHandler(ctx, { nodeId: 'a' })
    expect(store.selectedNodeId.value).toBeNull()
  })

  it('does not clear selectedNodeId when removing different node', () => {
    const { ctx, store } = setup([makeNode('a'), makeNode('b')])
    store.selectNode('b')
    removeNodeHandler(ctx, { nodeId: 'a' })
    expect(store.selectedNodeId.value).toBe('b')
  })

  it('blocks remove when sortable constraint violated', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, registry } = setup([makeNode('a'), makeNode('b')])
    // Register 'text' as non-sortable (locked)
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    // Removing 'a' (index 0) would shift locked 'b' (index 1) -> blocked
    removeNodeHandler(ctx, { nodeId: 'a' })
    expect(ctx.draft.root.children).toHaveLength(2)
    warn.mockRestore()
  })

  it('does not let chrome nodes affect content removal constraints', () => {
    const { ctx, registry } = setup([
      makeNode('tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }),
      makeNode('locked'),
      makeNode('free'),
    ])
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    removeNodeHandler(ctx, { nodeId: 'tabbar' })

    const ids = ctx.draft.root.children!.map(c => c.id)
    expect(ids).toEqual(['locked', 'free'])
  })

  it('removes a container subtree and clears descendant interaction state', () => {
    const container = makeContainer({ required: [makeNode('required')], open: [makeNode('child')] })
    const { ctx, store } = setupWithContainer(container)
    store.selectNode('child')
    store.hoverNode('required')

    expect(removeNodeHandler(ctx, { nodeId: 'layout' })).toEqual({
      ok: true,
      eventPayload: {
        nodeId: 'layout',
        source: { kind: 'root', index: 0 },
      },
    })
    expect(ctx.draft.root.children).toEqual([])
    expect(store.selectedNodeId.value).toBeNull()
    expect(store.hoveredNodeId.value).toBeNull()
  })

  it('removes a region-owned child and clears its interaction state', () => {
    const container = makeContainer({
      required: [makeNode('required')],
      open: [makeNode('first'), makeNode('child')],
    })
    const { ctx, store } = setupWithContainer(container)
    store.selectNode('child')
    store.hoverNode('child')

    expect(removeNodeHandler(ctx, { nodeId: 'child' })).toMatchObject({ ok: true })
    expect(ctx.draft.root.children![0].container!.regions.open.map(node => node.id)).toEqual(['first'])
    expect(store.selectedNodeId.value).toBeNull()
    expect(store.hoveredNodeId.value).toBeNull()
  })

  it('rejects region removal that would violate minItems', () => {
    const container = makeContainer({ required: [makeNode('required')], open: [] })
    const { ctx, store } = setupWithContainer(container)
    const before = store.getSchema()

    expect(removeNodeHandler(ctx, { nodeId: 'required' })).toEqual({
      ok: false,
      code: 'CONTAINER_REGION_MIN_ITEMS',
    })
    expect(store.getSchema()).toEqual(before)
  })

  it('rejects region removal that would shift an absolute-index lock', () => {
    const container = makeContainer({
      required: [makeNode('required')],
      open: [makeNode('first'), { ...makeNode('locked'), type: 'locked' }],
    })
    const { ctx, registry, store } = setupWithContainer(container)
    registry.registerWidget({
      type: 'locked',
      title: 'Locked',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      sortable: false,
    })
    const before = store.getSchema()

    expect(removeNodeHandler(ctx, { nodeId: 'first' })).toEqual({
      ok: false,
      code: 'SORTABLE_LOCK_VIOLATION',
    })
    expect(store.getSchema()).toEqual(before)
  })

  it.each([
    ['definition', (container: SchemaNode) => { container.type = 'missing-layout' }],
    ['variant', (container: SchemaNode) => { container.container!.variant = 'missing' }],
    ['region', (container: SchemaNode) => {
      container.container!.regions.legacy = container.container!.regions.open
      delete container.container!.regions.open
    }],
  ])('rejects removal from an unresolved source %s without mutation', (_, makeUnresolved) => {
    const container = makeContainer({ required: [makeNode('required')], open: [makeNode('child')] })
    makeUnresolved(container)
    const { ctx, store } = setupWithContainer(container)
    const before = store.getSchema()

    expect(removeNodeHandler(ctx, { nodeId: 'child' })).toEqual({
      ok: false,
      code: 'UNRESOLVED_CONTAINER_READ_ONLY',
    })
    expect(store.getSchema()).toEqual(before)
  })

  it('rejects removing a container whose external definition is unresolved', () => {
    const container = makeContainer({ required: [makeNode('required')], open: [] })
    const { ctx, store } = setup([container])
    const before = store.getSchema()

    expect(removeNodeHandler(ctx, { nodeId: 'layout' })).toEqual({
      ok: false,
      code: 'UNRESOLVED_CONTAINER_READ_ONLY',
    })
    expect(store.getSchema()).toEqual(before)
  })

  it('honors deletable behavior before removing a node', () => {
    const { ctx, registry } = setup([makeNode('fixed')])
    registry.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      deletable: false,
    })

    expect(removeNodeHandler(ctx, { nodeId: 'fixed' })).toEqual({
      ok: false,
      code: 'NODE_NOT_DELETABLE',
    })
    expect(ctx.draft.root.children!.map(node => node.id)).toEqual(['fixed'])
  })
})
