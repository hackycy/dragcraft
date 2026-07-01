import type { CommandContext, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { moveNodeHandler } from './move-node'

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: {} }
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

describe('moveNodeHandler', () => {
  it('moves node from one position to another', () => {
    const { ctx, store } = setup([makeNode('a'), makeNode('b'), makeNode('c')])
    moveNodeHandler(ctx, { nodeId: 'a', index: 2 })
    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  it('moves node to same position (no-op)', () => {
    const { ctx, store } = setup([makeNode('a'), makeNode('b')])
    moveNodeHandler(ctx, { nodeId: 'a', index: 0 })
    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['a', 'b'])
  })

  it('does nothing when node not found', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, store } = setup([makeNode('a')])
    moveNodeHandler(ctx, { nodeId: 'missing', index: 0 })
    expect(store.getRawSchema().root.children).toHaveLength(1)
    warn.mockRestore()
  })

  it('does nothing when children is undefined', () => {
    const { ctx, store } = setup([])
    store.getRawSchema().root.children = undefined as any
    moveNodeHandler(ctx, { nodeId: 'a', index: 0 })
    // Should not throw
  })

  it('blocks move when sortable constraint violated (moving locked widget)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx, registry, store } = setup([makeNode('a'), makeNode('b')])
    registry.registerWidget({ type: 'text', title: 'Text', group: 'g', defaultProps: {}, formSchema: { sections: [] }, sortable: false })

    // Both are locked (sortable=false). Moving 'a' should be blocked.
    moveNodeHandler(ctx, { nodeId: 'a', index: 1 })
    const ids = store.getRawSchema().root.children!.map(c => c.id)
    expect(ids).toEqual(['a', 'b']) // unchanged
    warn.mockRestore()
  })
})
