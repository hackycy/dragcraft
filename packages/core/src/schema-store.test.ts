import type { DesignerSchema, SchemaNode } from './types'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultSchema, createSchemaStore } from './schema-store'

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: { theme: 'light' },
    root: { id: 'root', type: 'root', props: {}, children },
  }
}

describe('createDefaultSchema', () => {
  it('returns schema with version and empty root', () => {
    const s = createDefaultSchema()
    expect(s.version).toBe('1.0.0')
    expect(s.root.id).toBe('root')
    expect(s.root.children).toEqual([])
  })
})

describe('createSchemaStore', () => {
  it('uses default schema when no initial provided', () => {
    const store = createSchemaStore()
    expect(store.schema.value.version).toBe('1.0.0')
    expect(store.schema.value.root.children).toEqual([])
  })

  it('uses provided initial schema (cloned)', () => {
    const initial = makeSchema([{ id: 'a', type: 'text', props: {} }])
    const store = createSchemaStore(initial)
    expect(store.schema.value.root.children).toHaveLength(1)
    // Verify it's a clone
    initial.root.children!.push({ id: 'b', type: 'text', props: {} })
    expect(store.schema.value.root.children).toHaveLength(1)
  })

  it('getSchema returns deep clone', () => {
    const store = createSchemaStore(makeSchema())
    const a = store.getSchema()
    const b = store.getSchema()
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
  })

  it('getRawSchema returns same reference', () => {
    const store = createSchemaStore(makeSchema())
    const a = store.getRawSchema()
    const b = store.getRawSchema()
    expect(a).toBe(b)
  })

  it('setSchema replaces schema (cloned)', () => {
    const store = createSchemaStore()
    const newSchema = makeSchema([{ id: 'x', type: 'text', props: {} }])
    store.setSchema(newSchema)
    expect(store.schema.value.root.children).toHaveLength(1)
    // Verify clone
    newSchema.root.children!.push({ id: 'y', type: 'text', props: {} })
    expect(store.schema.value.root.children).toHaveLength(1)
  })

  it('selectNode updates selectedNodeId', () => {
    const store = createSchemaStore()
    expect(store.selectedNodeId.value).toBeNull()
    store.selectNode('a')
    expect(store.selectedNodeId.value).toBe('a')
    store.selectNode(null)
    expect(store.selectedNodeId.value).toBeNull()
  })

  it('hoverNode updates hoveredNodeId', () => {
    const store = createSchemaStore()
    expect(store.hoveredNodeId.value).toBeNull()
    store.hoverNode('b')
    expect(store.hoveredNodeId.value).toBe('b')
  })

  it('onSelectionChange callback is called on selectNode', () => {
    const callback = vi.fn()
    const store = createSchemaStore(undefined, callback)
    store.selectNode('a')
    expect(callback).toHaveBeenCalledWith('a')
    store.selectNode(null)
    expect(callback).toHaveBeenCalledWith(null)
  })

  it('setDragTarget updates dragTarget', () => {
    const store = createSchemaStore()
    const target = { sourceNodeId: 'a', widgetType: null }
    store.setDragTarget(target)
    expect(store.dragTarget.value).toEqual(target)
    store.setDragTarget(null)
    expect(store.dragTarget.value).toBeNull()
  })

  it('getNodeById finds root and children', () => {
    const store = createSchemaStore(makeSchema([{ id: 'a', type: 'text', props: {} }]))
    expect(store.getNodeById('root')).toBeTruthy()
    expect(store.getNodeById('a')).toBeTruthy()
    expect(store.getNodeById('missing')).toBeNull()
  })

  it('applyTransientPatch updates props', () => {
    const store = createSchemaStore(makeSchema([{ id: 'a', type: 'text', props: { label: 'old' } }]))
    store.applyTransientPatch('a', { props: { label: 'new' } })
    expect(store.getNodeById('a')!.props.label).toBe('new')
  })

  it('applyTransientPatch updates style', () => {
    const store = createSchemaStore(makeSchema([{ id: 'a', type: 'text', props: {} }]))
    store.applyTransientPatch('a', { style: { content: { color: 'red' } } })
    expect(store.getNodeById('a')!.style).toEqual({ content: { color: 'red' } })
  })

  it('applyTransientPatch deep merges style scopes', () => {
    const store = createSchemaStore(makeSchema([{
      id: 'a',
      type: 'text',
      props: {},
      style: { container: { marginTop: -8 } },
    }]))
    store.applyTransientPatch('a', { style: { container: { marginBottom: 12 } } })
    expect(store.getNodeById('a')!.style).toEqual({ container: { marginTop: -8, marginBottom: 12 } })
  })

  it('applyTransientPatch does nothing for missing node', () => {
    const store = createSchemaStore(makeSchema())
    store.applyTransientPatch('missing', { props: { x: 1 } })
    // Should not throw
  })

  it('triggerUpdate does not throw', () => {
    const store = createSchemaStore()
    store.triggerUpdate()
  })
})
