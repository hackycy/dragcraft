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
