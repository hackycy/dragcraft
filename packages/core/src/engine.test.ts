import type { DesignerSchema, SchemaNode } from './types'
import { describe, expect, it, vi } from 'vitest'
import { CommandType } from './constants'
import { createEngine } from './engine'

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: {} }
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

describe('createEngine', () => {
  it('initializes with default schema', () => {
    const engine = createEngine()
    expect(engine.store.schema.value.version).toBe('1.0.0')
    expect(engine.store.schema.value.root.children).toEqual([])
    engine.dispose()
  })

  it('initializes with provided schema', () => {
    const schema = makeSchema([makeNode('a')])
    const engine = createEngine({ initialSchema: schema })
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    engine.dispose()
  })

  it('execute ADD_NODE adds a node', () => {
    const engine = createEngine()
    engine.execute({
      type: CommandType.ADD_NODE,
      payload: { node: makeNode('a') },
    })
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    expect(engine.store.schema.value.root.children![0].id).toBe('a')
    engine.dispose()
  })

  it('execute UPDATE_PROPS updates node props', () => {
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a')]) })
    engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'a', props: { label: 'updated' } },
    })
    expect(engine.store.schema.value.root.children![0].props.label).toBe('updated')
    engine.dispose()
  })

  it('execute REMOVE_NODE removes a node', () => {
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a'), makeNode('b')]) })
    engine.execute({ type: CommandType.REMOVE_NODE, payload: { nodeId: 'a' } })
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    expect(engine.store.schema.value.root.children![0].id).toBe('b')
    engine.dispose()
  })

  it('registerWidget registers in registry', () => {
    const engine = createEngine()
    engine.registerWidget({ type: 'button', title: 'Button', group: 'basic', defaultProps: {}, formSchema: { sections: [] } })
    expect(engine.registry.getWidget('button')).toBeTruthy()
    engine.dispose()
  })

  it('registerHandler registers custom command', () => {
    const engine = createEngine()
    const handler = vi.fn()
    engine.registerHandler('CUSTOM', handler)
    engine.execute({ type: 'CUSTOM', payload: { x: 1 } })
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ store: expect.any(Object), registry: expect.any(Object) }),
      { x: 1 },
    )
    engine.dispose()
  })

  it('exportSchema returns deep clone', () => {
    const engine = createEngine({ initialSchema: makeSchema([makeNode('a')]) })
    const exported = engine.exportSchema()
    expect(exported.root.children).toHaveLength(1)
    // Verify it's a clone
    exported.root.children!.push(makeNode('b'))
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    engine.dispose()
  })

  it('importSchema replaces schema and clears history', () => {
    const engine = createEngine()
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('a') } })
    expect(engine.history.canUndo()).toBe(true)

    const newSchema = makeSchema([makeNode('x'), makeNode('y')])
    engine.importSchema(newSchema)
    expect(engine.store.schema.value.root.children).toHaveLength(2)
    expect(engine.history.canUndo()).toBe(false)
    engine.dispose()
  })

  it('importSchema warns on invalid schema', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createEngine()
    engine.importSchema({ version: '1.0.0', globalConfig: {}, root: null as any })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid schema'))
    warn.mockRestore()
    engine.dispose()
  })

  it('sELECTION_CHANGED event is emitted on selectNode', () => {
    const engine = createEngine()
    const listener = vi.fn()
    engine.eventHub.on('selection:changed', listener)
    engine.store.selectNode('a')
    expect(listener).toHaveBeenCalledWith('a')
    engine.store.selectNode(null)
    expect(listener).toHaveBeenCalledWith(null)
    expect(listener).toHaveBeenCalledTimes(2)
    engine.dispose()
  })

  it('dispose clears state', () => {
    const engine = createEngine()
    engine.store.selectNode('a')
    engine.store.hoverNode('b')
    engine.dispose()
    expect(engine.store.selectedNodeId.value).toBeNull()
    expect(engine.store.hoveredNodeId.value).toBeNull()
    expect(engine.store.dragTarget.value).toBeNull()
  })

  it('undo/redo work through engine', () => {
    const engine = createEngine()
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('a') } })
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('b') } })
    expect(engine.store.schema.value.root.children).toHaveLength(2)

    engine.history.undo()
    expect(engine.store.schema.value.root.children).toHaveLength(1)

    engine.history.redo()
    expect(engine.store.schema.value.root.children).toHaveLength(2)
    engine.dispose()
  })

  describe('schema migration', () => {
    it('registerMigration and migrateSchema applies single migration', () => {
      const engine = createEngine()
      engine.registerMigration({
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        migrate: (schema) => {
          schema.version = '2.0.0'
          schema.globalConfig.migrated = true
          return schema
        },
      })

      const oldSchema = makeSchema()
      oldSchema.version = '1.0.0'
      const migrated = engine.migrateSchema(oldSchema)
      expect(migrated.version).toBe('2.0.0')
      expect(migrated.globalConfig.migrated).toBe(true)
      engine.dispose()
    })

    it('migrateSchema chains multiple migrations', () => {
      const engine = createEngine()
      engine.registerMigration({
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        migrate: (schema) => {
          schema.version = '1.1.0'
          schema.globalConfig.step1 = true
          return schema
        },
      })
      engine.registerMigration({
        fromVersion: '1.1.0',
        toVersion: '2.0.0',
        migrate: (schema) => {
          schema.version = '2.0.0'
          schema.globalConfig.step2 = true
          return schema
        },
      })

      const oldSchema = makeSchema()
      oldSchema.version = '1.0.0'
      const migrated = engine.migrateSchema(oldSchema)
      expect(migrated.version).toBe('2.0.0')
      expect(migrated.globalConfig.step1).toBe(true)
      expect(migrated.globalConfig.step2).toBe(true)
      engine.dispose()
    })

    it('migrateSchema returns schema unchanged when no migration applies', () => {
      const engine = createEngine()
      engine.registerMigration({
        fromVersion: '0.9.0',
        toVersion: '1.0.0',
        migrate: (schema) => {
          schema.version = '1.0.0'
          return schema
        },
      })

      const schema = makeSchema()
      schema.version = '1.0.0'
      const result = engine.migrateSchema(schema)
      expect(result.version).toBe('1.0.0')
      engine.dispose()
    })

    it('importSchema auto-migrates', () => {
      const engine = createEngine()
      engine.registerMigration({
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        migrate: (schema) => {
          schema.version = '2.0.0'
          schema.globalConfig.autoMigrated = true
          return schema
        },
      })

      const oldSchema = makeSchema()
      oldSchema.version = '1.0.0'
      engine.importSchema(oldSchema)
      expect(engine.store.schema.value.version).toBe('2.0.0')
      expect(engine.store.schema.value.globalConfig.autoMigrated).toBe(true)
      engine.dispose()
    })
  })
})
