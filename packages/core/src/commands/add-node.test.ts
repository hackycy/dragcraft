import type { CommandContext, ContainerDefinition, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { addNodeHandler } from './add-node'

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function makeNode(id: string, layout?: SchemaNode['layout']): SchemaNode {
  return { id, type: 'text', props: {}, layout }
}

function setup(initial?: DesignerSchema) {
  const store = createSchemaStore(initial ?? makeSchema())
  const registry = createRegistry()
  const ctx: CommandContext = { schema: store.getSnapshot(), draft: store.getSchema(), store, registry }
  return { store, registry, ctx }
}

const splitDefinition: ContainerDefinition = {
  defaultVariant: 'split',
  variants: {
    split: {
      title: 'Split',
      regions: [
        { id: 'left', title: 'Left' },
        { id: 'right', title: 'Right', constraints: { maxItems: 1 } },
      ],
    },
  },
}

function registerTextAndSplit(
  ctx: ReturnType<typeof setup>,
  definition: ContainerDefinition = splitDefinition,
) {
  ctx.registry.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
  })
  ctx.registry.registerWidget({
    type: 'split-layout',
    title: 'Split',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    container: definition,
  })
}

function makeSplitContainer(id: string): SchemaNode {
  return {
    id,
    type: 'split-layout',
    props: {},
    container: {
      variant: 'split',
      regions: { left: [], right: [] },
    },
  }
}

describe('addNodeHandler', () => {
  it('appends node to root.children', () => {
    const { ctx } = setup()
    const node = makeNode('a')
    addNodeHandler(ctx, { node })
    expect(ctx.draft.root.children).toHaveLength(1)
    expect(ctx.draft.root.children![0].id).toBe('a')
  })

  it('inserts node at specific index', () => {
    const { ctx } = setup(makeSchema([makeNode('a'), makeNode('c')]))
    addNodeHandler(ctx, { node: makeNode('b'), destination: { kind: 'root', index: 1 } })
    const children = ctx.draft.root.children!
    expect(children).toHaveLength(3)
    expect(children[1].id).toBe('b')
  })

  it('initializes children array if missing', () => {
    const { ctx } = setup()
    const raw = ctx.draft
    raw.root.children = undefined as any
    addNodeHandler(ctx, { node: makeNode('a') })
    expect(raw.root.children).toHaveLength(1)
  })

  it('blocks insert when sortable constraint violated', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Register a widget type with sortable=false
    const { ctx, registry } = setup(makeSchema([
      makeNode('locked'), // index 0, will be locked
    ]))
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    addNodeHandler(ctx, { node: makeNode('new'), destination: { kind: 'root', index: 0 } })
    // Insert at 0 would shift locked widget at index 0 -> blocked
    expect(ctx.draft.root.children).toHaveLength(1)
    expect(ctx.draft.root.children![0].id).toBe('locked')
    warn.mockRestore()
  })

  it('blocks add when creatable is false', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, registry } = setup()
    registry.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      creatable: false,
    })

    addNodeHandler(ctx, { node: makeNode('new') })

    expect(ctx.draft.root.children).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(
      '[dragcraft/core] ADD_NODE: blocked by creatable constraint for widget type "text"',
    )
    warn.mockRestore()
  })

  it('evaluates dynamic creatable with the current schema before add', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, registry } = setup(makeSchema([makeNode('existing')]))
    registry.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      creatable: ({ schema, widgetType }) => {
        const children = schema.root.children ?? []
        return !children.some(child => child.type === widgetType)
      },
    })

    addNodeHandler(ctx, { node: makeNode('new') })

    expect(ctx.draft.root.children).toHaveLength(1)
    expect(ctx.draft.root.children![0].id).toBe('existing')
    warn.mockRestore()
  })

  it('includes creatable reason metadata in warning when available', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, registry } = setup()
    registry.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      creatable: {
        allowed: false,
        code: 'singleton.text',
        message: 'Only one text widget is allowed',
      },
    })

    addNodeHandler(ctx, { node: makeNode('new') })

    expect(ctx.draft.root.children).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(
      '[dragcraft/core] ADD_NODE: blocked by creatable constraint for widget type "text" (Only one text widget is allowed)',
    )
    warn.mockRestore()
  })

  it('inserts by sort-scope index when chrome nodes exist', () => {
    const { ctx, registry } = setup(makeSchema([
      makeNode('a'),
      makeNode('tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }),
    ]))
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] } })

    addNodeHandler(ctx, { node: makeNode('new'), destination: { kind: 'root', index: 1 } })
    const children = ctx.draft.root.children!
    expect(children).toHaveLength(3)
    expect(children[1].id).toBe('new')
    expect(children[2].id).toBe('tabbar')
  })

  it('allows insert after all locked widgets', () => {
    const { ctx, registry } = setup(makeSchema([
      makeNode('locked'),
    ]))
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    addNodeHandler(ctx, { node: makeNode('new'), destination: { kind: 'root', index: 1 } })
    expect(ctx.draft.root.children).toHaveLength(2)
    expect(ctx.draft.root.children![1].id).toBe('new')
  })

  it('adds a container at root and initializes every default region', () => {
    const setupResult = setup()
    registerTextAndSplit(setupResult)

    const result = addNodeHandler(setupResult.ctx, {
      node: { id: 'layout', type: 'split-layout', props: {} },
      destination: { kind: 'root', index: 0 },
    })

    expect(result).toEqual({
      ok: true,
      eventPayload: {
        nodeId: 'layout',
        destination: { kind: 'root', sortScope: 'content', index: 0 },
      },
    })
    expect(setupResult.ctx.draft.root.children![0].container).toEqual({
      variant: 'split',
      regions: { left: [], right: [] },
    })
  })

  it('adds a widget into a container region and strips page placement', () => {
    const setupResult = setup(makeSchema([makeSplitContainer('layout')]))
    registerTextAndSplit(setupResult)
    const node = makeNode('text', { placement: { kind: 'flow', region: 'hero' }, order: 3 })

    const result = addNodeHandler(setupResult.ctx, {
      node,
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })

    expect(result).toEqual({
      ok: true,
      eventPayload: {
        nodeId: 'text',
        destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
      },
    })
    expect(setupResult.ctx.draft.root.children![0].container!.regions.left[0]).toMatchObject({
      id: 'text',
      layout: {},
    })
    expect(node.layout).toEqual({ placement: { kind: 'flow', region: 'hero' }, order: 3 })
  })

  it('rejects a nested container without mutating either owner', () => {
    const setupResult = setup(makeSchema([makeSplitContainer('layout')]))
    registerTextAndSplit(setupResult)
    const before = setupResult.store.getSchema()

    const result = addNodeHandler(setupResult.ctx, {
      node: { id: 'nested', type: 'split-layout', props: {} },
      destination: { kind: 'container', containerId: 'layout', regionId: 'left' },
    })

    expect(result).toMatchObject({ ok: false, code: 'CONTAINER_NESTING_FORBIDDEN' })
    expect(setupResult.store.getSchema()).toEqual(before)
  })

  it('honors region maxItems before mutating the destination', () => {
    const container = makeSplitContainer('layout')
    container.container!.regions.right.push(makeNode('existing'))
    const setupResult = setup(makeSchema([container]))
    registerTextAndSplit(setupResult)
    const before = setupResult.store.getSchema()

    const result = addNodeHandler(setupResult.ctx, {
      node: makeNode('new'),
      destination: { kind: 'container', containerId: 'layout', regionId: 'right' },
    })

    expect(result).toMatchObject({ ok: false, code: 'CONTAINER_REGION_MAX_ITEMS' })
    expect(setupResult.store.getSchema()).toEqual(before)
  })

  it('rejects a region insertion that would shift an absolute-index lock', () => {
    const container = makeSplitContainer('layout')
    container.container!.regions.left.push({ ...makeNode('locked'), type: 'locked' })
    const setupResult = setup(makeSchema([container]))
    registerTextAndSplit(setupResult)
    setupResult.registry.registerWidget({
      type: 'locked',
      title: 'Locked',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      sortable: false,
    })
    const before = setupResult.store.getSchema()

    const result = addNodeHandler(setupResult.ctx, {
      node: makeNode('new'),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
    })

    expect(result).toEqual({ ok: false, code: 'SORTABLE_LOCK_VIOLATION' })
    expect(setupResult.store.getSchema()).toEqual(before)
  })

  it('normalizes a placement denial without a material-defined code', () => {
    const setupResult = setup(makeSchema([makeSplitContainer('layout')]))
    registerTextAndSplit(setupResult, {
      ...splitDefinition,
      canPlace: () => ({ allowed: false }),
    })

    const result = addNodeHandler(setupResult.ctx, {
      node: makeNode('new'),
      destination: { kind: 'container', containerId: 'layout', regionId: 'left' },
    })

    expect(result).toEqual({ ok: false, code: 'CONTAINER_PLACEMENT_DENIED' })
  })
})
