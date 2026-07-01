import type { CommandContext, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { addNodeHandler } from './add-node'

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: {} }
}

function setup(initial?: DesignerSchema) {
  const store = createSchemaStore(initial ?? makeSchema())
  const registry = createRegistry()
  const ctx: CommandContext = { store, registry }
  return { store, registry, ctx }
}

describe('addNodeHandler', () => {
  it('appends node to root.children', () => {
    const { ctx, store } = setup()
    const node = makeNode('a')
    addNodeHandler(ctx, { node })
    expect(store.getRawSchema().root.children).toHaveLength(1)
    expect(store.getRawSchema().root.children![0].id).toBe('a')
  })

  it('inserts node at specific index', () => {
    const { ctx, store } = setup(makeSchema([makeNode('a'), makeNode('c')]))
    addNodeHandler(ctx, { node: makeNode('b'), index: 1 })
    const children = store.getRawSchema().root.children!
    expect(children).toHaveLength(3)
    expect(children[1].id).toBe('b')
  })

  it('initializes children array if missing', () => {
    const { ctx, store } = setup()
    const raw = store.getRawSchema()
    raw.root.children = undefined as any
    addNodeHandler(ctx, { node: makeNode('a') })
    expect(raw.root.children).toHaveLength(1)
  })

  it('blocks insert when sortable constraint violated', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Register a widget type with sortable=false
    const { ctx, registry, store } = setup(makeSchema([
      makeNode('locked'), // index 0, will be locked
    ]))
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    addNodeHandler(ctx, { node: makeNode('new'), index: 0 })
    // Insert at 0 would shift locked widget at index 0 -> blocked
    expect(store.getRawSchema().root.children).toHaveLength(1)
    expect(store.getRawSchema().root.children![0].id).toBe('locked')
    warn.mockRestore()
  })

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

  it('allows insert after all locked widgets', () => {
    const { ctx, registry, store } = setup(makeSchema([
      makeNode('locked'),
    ]))
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    addNodeHandler(ctx, { node: makeNode('new'), index: 1 })
    expect(store.getRawSchema().root.children).toHaveLength(2)
    expect(store.getRawSchema().root.children![1].id).toBe('new')
  })
})
