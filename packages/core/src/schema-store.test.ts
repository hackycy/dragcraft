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

  it('getSnapshot returns a stable frozen reference', () => {
    const store = createSchemaStore(makeSchema())
    const a = store.getSnapshot()
    const b = store.getSnapshot()
    expect(a).toBe(b)
    expect(Object.isFrozen(a)).toBe(true)
    expect(Object.isFrozen(a.root)).toBe(true)
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

  it('isolates dragTarget from later caller mutations', () => {
    const store = createSchemaStore()
    const target = { sourceNodeId: 'a', widgetType: null as string | null }
    store.setDragTarget(target)

    target.sourceNodeId = 'mutated'
    target.widgetType = 'other'

    expect(store.dragTarget.value).toEqual({ sourceNodeId: 'a', widgetType: null })
  })

  it('getNodeById finds root and children', () => {
    const store = createSchemaStore(makeSchema([{ id: 'a', type: 'text', props: {} }]))
    expect(store.getNodeById('root')).toBeTruthy()
    expect(store.getNodeById('a')).toBeTruthy()
    expect(store.getNodeById('missing')).toBeNull()
  })

  it('getNodeById finds a region-owned child', () => {
    const nested: SchemaNode = { id: 'nested', type: 'text', props: {} }
    const container: SchemaNode = {
      id: 'layout',
      type: 'layout',
      props: {},
      container: { variant: 'default', regions: { left: [nested] } },
    }
    const store = createSchemaStore(makeSchema([container]))

    expect(store.getNodeById('nested')?.id).toBe('nested')
  })

  it('commitSchema adopts and freezes a command-owned draft', () => {
    const store = createSchemaStore(makeSchema())
    const draft = store.getSchema()
    draft.globalConfig.theme = 'dark'

    const snapshot = store.commitSchema(draft)

    expect(store.getSnapshot()).toBe(snapshot)
    expect(store.getSnapshot().globalConfig.theme).toBe('dark')
    expect(Object.isFrozen(draft)).toBe(true)
  })
})
