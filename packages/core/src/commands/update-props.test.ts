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
  const ctx: CommandContext = { schema: store.getSnapshot(), draft: store.getSchema(), store, registry }
  return { store, ctx }
}

describe('updatePropsHandler', () => {
  it('merges props onto node', () => {
    const { ctx } = setup([makeNode('a', { label: 'old', color: 'blue' })])
    updatePropsHandler(ctx, { nodeId: 'a', props: { label: 'new' } })
    const node = ctx.draft.root.children![0]
    expect(node.props).toEqual({ label: 'new', color: 'blue' })
  })

  it('merges style onto node', () => {
    const { ctx } = setup([makeNode('a')])
    updatePropsHandler(ctx, { nodeId: 'a', props: {}, style: { content: { color: 'red' } } })
    const node = ctx.draft.root.children![0]
    expect(node.style).toEqual({ content: { color: 'red' } })
  })

  it('initializes style if missing', () => {
    const { ctx } = setup([makeNode('a')])
    expect(ctx.draft.root.children![0].style).toBeUndefined()
    updatePropsHandler(ctx, { nodeId: 'a', props: {}, style: { container: { marginTop: '10px' } } })
    expect(ctx.draft.root.children![0].style).toEqual({ container: { marginTop: '10px' } })
  })

  it('merges into existing style', () => {
    const node = makeNode('a')
    node.style = { container: { marginTop: '10px' }, content: { color: 'red' } }
    const { ctx } = setup([node])
    updatePropsHandler(ctx, { nodeId: 'a', props: {}, style: { container: { marginBottom: '4px' } } })
    expect(ctx.draft.root.children![0].style).toEqual({
      container: { marginTop: '10px', marginBottom: '4px' },
      content: { color: 'red' },
    })
  })

  it('warns when node not found', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ctx } = setup([makeNode('a')])
    updatePropsHandler(ctx, { nodeId: 'missing', props: { x: 1 } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not found'))
    warn.mockRestore()
  })

  it('updates root node props', () => {
    const { ctx } = setup([])
    updatePropsHandler(ctx, { nodeId: 'root', props: { title: 'My Page' } })
    expect(ctx.draft.root.props.title).toBe('My Page')
  })

  it('keeps schema-managed widgets configurable by default', () => {
    const { ctx } = setup([makeNode('a')])
    ctx.registry.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      authoring: 'schema-managed',
    })

    expect(updatePropsHandler(ctx, { nodeId: 'a', props: { label: 'new' } })).toMatchObject({ ok: true })
    expect(ctx.draft.root.children![0].props.label).toBe('new')
  })

  it('rejects props and style updates when configurable is denied', () => {
    const { ctx } = setup([makeNode('a', { label: 'old' })])
    ctx.registry.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'g',
      defaultProps: {},
      formSchema: { sections: [] },
      authoring: 'schema-managed',
      configurable: false,
    })

    expect(updatePropsHandler(ctx, {
      nodeId: 'a',
      props: { label: 'new' },
      style: { content: { color: 'red' } },
    })).toEqual({ ok: false, code: 'NODE_NOT_CONFIGURABLE' })
    expect(ctx.draft.root.children![0]).toEqual(makeNode('a', { label: 'old' }))
  })
})
