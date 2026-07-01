import type { CommandContext, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { createRegistry } from '../registry'
import { createSchemaStore } from '../schema-store'
import { updatePropsHandler } from './update-props'

function makeNode(id: string, props: Record<string, unknown> = {}): SchemaNode {
  return { id, type: 'text', props }
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function setup(children: SchemaNode[]) {
  const store = createSchemaStore(makeSchema(children))
  const registry = createRegistry()
  const ctx: CommandContext = { store, registry }
  return { store, ctx }
}

describe('updatePropsHandler', () => {
  it('merges props onto node', () => {
    const { ctx, store } = setup([makeNode('a', { label: 'old', color: 'blue' })])
    updatePropsHandler(ctx, { nodeId: 'a', props: { label: 'new' } })
    const node = store.getRawSchema().root.children![0]
    expect(node.props).toEqual({ label: 'new', color: 'blue' })
  })

  it('merges style onto node', () => {
    const { ctx, store } = setup([makeNode('a')])
    updatePropsHandler(ctx, { nodeId: 'a', props: {}, style: { color: 'red' } })
    const node = store.getRawSchema().root.children![0]
    expect(node.style).toEqual({ color: 'red' })
  })

  it('initializes style if missing', () => {
    const { ctx, store } = setup([makeNode('a')])
    expect(store.getRawSchema().root.children![0].style).toBeUndefined()
    updatePropsHandler(ctx, { nodeId: 'a', props: {}, style: { margin: '10px' } })
    expect(store.getRawSchema().root.children![0].style).toEqual({ margin: '10px' })
  })

  it('merges into existing style', () => {
    const node = makeNode('a')
    node.style = { color: 'red' }
    const { ctx, store } = setup([node])
    updatePropsHandler(ctx, { nodeId: 'a', props: {}, style: { margin: '10px' } })
    expect(store.getRawSchema().root.children![0].style).toEqual({ color: 'red', margin: '10px' })
  })

  it('warns when node not found', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx } = setup([makeNode('a')])
    updatePropsHandler(ctx, { nodeId: 'missing', props: { x: 1 } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not found'))
    warn.mockRestore()
  })

  it('updates root node props', () => {
    const { ctx, store } = setup([])
    updatePropsHandler(ctx, { nodeId: 'root', props: { title: 'My Page' } })
    expect(store.getRawSchema().root.props.title).toBe('My Page')
  })
})
