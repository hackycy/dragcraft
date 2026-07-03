import type { CommandContext, DesignerSchema, SchemaNode } from '../types'
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
  const ctx: CommandContext = { store, registry }
  return { store, registry, ctx }
}

describe('removeNodeHandler', () => {
  it('removes node by id', () => {
    const { ctx, store } = setup([makeNode('a'), makeNode('b')])
    removeNodeHandler(ctx, { nodeId: 'a' })
    expect(store.getRawSchema().root.children).toHaveLength(1)
    expect(store.getRawSchema().root.children![0].id).toBe('b')
  })

  it('warns when trying to remove root', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, store } = setup([makeNode('a')])
    removeNodeHandler(ctx, { nodeId: 'root' })
    expect(store.getRawSchema().root.children).toHaveLength(1)
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
    const { ctx, registry, store } = setup([makeNode('a'), makeNode('b')])
    // Register 'text' as non-sortable (locked)
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    // Removing 'a' (index 0) would shift locked 'b' (index 1) -> blocked
    removeNodeHandler(ctx, { nodeId: 'a' })
    expect(store.getRawSchema().root.children).toHaveLength(2)
    warn.mockRestore()
  })

  it('does not let chrome nodes affect content removal constraints', () => {
    const { ctx, registry, store } = setup([
      makeNode('tabbar', { placement: { kind: 'chrome', edge: 'block-end' } }),
      makeNode('locked'),
      makeNode('free'),
    ])
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    removeNodeHandler(ctx, { nodeId: 'tabbar' })

    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['locked', 'free'])
  })
})
