import type { DocumentSchema, NodeDefinition } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { createBindingAction, readBindingValue, resolveFieldBinding } from './field-binding'

const node: NodeDefinition = {
  id: 'text-1',
  type: 'text',
  props: { title: 'Hello' },
  style: { color: 'red' },
}
const schema: DocumentSchema = {
  version: '1',
  globalConfig: { theme: 'light' },
  page: { props: { title: 'Page' } },
  nodes: [node],
  structure: { root: ['text-1'], containers: {} },
}

describe('field binding authoring compiler', () => {
  it('reads only accepted document data paths', () => {
    expect(readBindingValue({ scope: 'node', path: 'props.title' }, schema, node)).toBe('Hello')
    expect(readBindingValue({ scope: 'node', path: 'style.color' }, schema, node)).toBe('red')
    expect(readBindingValue({ scope: 'globalConfig', path: 'theme' }, schema, null)).toBe('light')
    expect(readBindingValue({ scope: 'schema', path: 'page.props.title' }, schema, null)).toBe('Page')
    expect(readBindingValue({ scope: 'container', path: 'variant' }, schema, node)).toBeUndefined()
  })

  it('compiles node and global edits into closed AuthoringAction values', () => {
    expect(createBindingAction({ scope: 'node', path: 'props.title' }, 'Updated', schema, node)).toEqual({
      type: 'update-node',
      nodeId: 'text-1',
      node: { type: 'text', props: { title: 'Updated' }, style: { color: 'red' } },
    })
    expect(createBindingAction({ scope: 'globalConfig', path: 'theme' }, 'dark', schema, null)).toEqual({
      type: 'update-global-config',
      globalConfig: { theme: 'dark' },
    })
  })

  it('rejects removed container writes and unsafe paths', () => {
    expect(createBindingAction({ scope: 'container', path: 'variant' }, 'tabs', schema, node)).toBeNull()
    expect(createBindingAction({ scope: 'node', path: 'props.__proto__.x' }, 1, schema, node)).toBeNull()
    expect(resolveFieldBinding(undefined, { scope: 'node', path: 'props.title' })).toEqual({
      scope: 'node',
      path: 'props.title',
    })
  })
})
