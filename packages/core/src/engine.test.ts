import type { ContainerDefinition, DesignerSchema, SchemaNode } from './types'
import { describe, expect, it, vi } from 'vitest'
import { CommandType, EventName } from './constants'
import { createEngine } from './engine'

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: {} }
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return { version: '1.0.0', globalConfig: {}, root: { id: 'root', type: 'root', props: {}, children } }
}

function createImportedEngine(schema: DesignerSchema): ReturnType<typeof createEngine> {
  const engine = createEngine()
  const result = engine.importSchema(schema)
  if (!result.ok)
    throw new Error(`Test schema rejected: ${result.diagnostics.map(item => item.code).join(', ')}`)
  return engine
}

function registerSingleRegionContainer(engine: ReturnType<typeof createEngine>): void {
  engine.registerWidget({
    type: 'single-layout',
    title: 'Single layout',
    group: 'layout',
    defaultProps: {},
    formSchema: { sections: [] },
    container: {
      defaultVariant: 'single',
      variants: {
        single: {
          title: 'Single',
          regions: [{ id: 'content', title: 'Content' }],
        },
      },
    },
  })
}

function makeContainerNode(type = 'single-layout'): SchemaNode {
  return {
    id: 'layout',
    type,
    props: {},
    container: {
      variant: 'single',
      regions: { content: [] },
    },
  }
}

function makeVariantEngine(migrateVariant: ContainerDefinition['migrateVariant']) {
  const container: SchemaNode = {
    id: 'layout',
    type: 'variant-layout',
    props: {},
    container: {
      variant: 'split',
      regions: { left: [makeNode('left')], right: [makeNode('right')] },
    },
  }
  const engine = createEngine()
  engine.registerWidget({
    type: 'variant-layout',
    title: 'Variant',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    container: {
      defaultVariant: 'split',
      variants: {
        split: {
          title: 'Split',
          regions: [{ id: 'left', title: 'Left' }, { id: 'right', title: 'Right' }],
        },
        stacked: {
          title: 'Stacked',
          regions: [{ id: 'body', title: 'Body' }],
        },
      },
      migrateVariant,
    },
  })
  const result = engine.importSchema(makeSchema([container]))
  if (!result.ok)
    throw new Error(`Test schema rejected: ${result.diagnostics.map(item => item.code).join(', ')}`)
  return engine
}

describe('createEngine', () => {
  if (false) {
    // @ts-expect-error Core schemas must be imported after registry setup.
    createEngine({ initialSchema: makeSchema() })
  }

  it('initializes with default schema', () => {
    const engine = createEngine()
    expect(engine.store.schema.value.version).toBe('1.0.0')
    expect(engine.store.schema.value.root.children).toEqual([])
    engine.dispose()
  })

  it('imports a provided schema after engine creation', () => {
    const schema = makeSchema([makeNode('a')])
    const engine = createEngine()

    const result = engine.importSchema(schema)

    expect(result.ok).toBe(true)
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    engine.dispose()
  })

  it('execute ADD_NODE adds a node', () => {
    const engine = createEngine()
    const result = engine.execute({
      type: CommandType.ADD_NODE,
      payload: { node: makeNode('a') },
    })
    expect(result).toEqual({
      ok: true,
      eventPayload: {
        nodeId: 'a',
        destination: { kind: 'root', sortScope: 'content', index: 0 },
      },
    })
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    expect(engine.store.schema.value.root.children![0].id).toBe('a')
    engine.dispose()
  })

  it('execute ADD_NODE blocked by creatable does not push history or emit mutation events', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createEngine()
    const nodeAdded = vi.fn()
    const schemaChanged = vi.fn()
    engine.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'basic',
      defaultProps: {},
      formSchema: { sections: [] },
      creatable: false,
    })
    engine.eventHub.on(EventName.NODE_ADDED, nodeAdded)
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    const result = engine.execute({
      type: CommandType.ADD_NODE,
      payload: { node: makeNode('a') },
    })

    expect(result).toEqual({ ok: false, code: 'NODE_NOT_CREATABLE' })
    expect(engine.store.schema.value.root.children).toHaveLength(0)
    expect(engine.history.canUndo()).toBe(false)
    expect(nodeAdded).not.toHaveBeenCalled()
    expect(schemaChanged).not.toHaveBeenCalled()
    warn.mockRestore()
    engine.dispose()
  })

  it.each([
    ['an existing node ID', 'a'],
    ['the document root ID', 'root'],
  ])('execute ADD_NODE rejects %s without schema, history, or events', (_label, id) => {
    const engine = createImportedEngine(makeSchema([makeNode('a')]))
    const before = engine.exportSchema()
    const nodeAdded = vi.fn()
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.NODE_ADDED, nodeAdded)
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    const result = engine.execute({
      type: CommandType.ADD_NODE,
      payload: { node: makeNode(id) },
    })

    expect(result).toMatchObject({ ok: false, code: 'SCHEMA_NODE_ID_DUPLICATE' })
    expect(engine.exportSchema()).toEqual(before)
    expect(engine.history.canUndo()).toBe(false)
    expect(nodeAdded).not.toHaveBeenCalled()
    expect(schemaChanged).not.toHaveBeenCalled()
    engine.dispose()
  })

  it('execute ADD_NODE rejects a structurally invalid final candidate atomically', () => {
    const engine = createEngine()
    const before = engine.exportSchema()
    const nodeAdded = vi.fn()
    engine.eventHub.on(EventName.NODE_ADDED, nodeAdded)

    const result = engine.execute({
      type: CommandType.ADD_NODE,
      payload: { node: { id: 'bad', type: 'text', props: null } as unknown as SchemaNode },
    })

    expect(result).toMatchObject({ ok: false, code: 'SCHEMA_CANDIDATE_INVALID' })
    expect(engine.exportSchema()).toEqual(before)
    expect(engine.history.canUndo()).toBe(false)
    expect(nodeAdded).not.toHaveBeenCalled()
    engine.dispose()
  })

  it('rejects nested command execution from canPlace without nested history or events', () => {
    const engine = createEngine()
    let nestedResult: ReturnType<typeof engine.execute> | undefined
    engine.registerWidget({
      type: 'text',
      title: 'Text',
      group: 'basic',
      defaultProps: {},
      formSchema: { sections: [] },
    })
    engine.registerWidget({
      type: 'single-layout',
      title: 'Single layout',
      group: 'layout',
      defaultProps: {},
      formSchema: { sections: [] },
      container: {
        defaultVariant: 'single',
        variants: {
          single: { title: 'Single', regions: [{ id: 'content', title: 'Content' }] },
        },
        canPlace: () => {
          nestedResult = engine.execute({
            type: CommandType.ADD_NODE,
            payload: { node: makeNode('nested-side-effect') },
          })
          return { allowed: true }
        },
      },
    })
    const imported = engine.importSchema(makeSchema([makeContainerNode()]))
    if (!imported.ok)
      throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
    const nodeAdded = vi.fn()
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.NODE_ADDED, nodeAdded)
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    const result = engine.execute({
      type: CommandType.ADD_NODE,
      payload: {
        node: makeNode('intended'),
        destination: { kind: 'container', containerId: 'layout', regionId: 'content' },
      },
    })

    expect(result.ok).toBe(true)
    expect(nestedResult).toEqual({ ok: false, code: 'COMMAND_REENTRANT' })
    expect(engine.state.getNodeById('nested-side-effect')).toBeNull()
    expect(engine.state.getNodeById('intended')).not.toBeNull()
    expect(nodeAdded).toHaveBeenCalledOnce()
    expect(schemaChanged).toHaveBeenCalledOnce()
    expect(engine.history.canUndo()).toBe(true)
    engine.history.undo()
    expect(engine.state.getNodeById('intended')).toBeNull()
    expect(engine.history.canUndo()).toBe(false)
    engine.dispose()
  })

  it('execute UPDATE_PROPS updates node props', () => {
    const engine = createImportedEngine(makeSchema([makeNode('a')]))
    engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'a', props: { label: 'updated' } },
    })
    expect(engine.store.schema.value.root.children![0].props.label).toBe('updated')
    engine.dispose()
  })

  it.each([
    [CommandType.UPDATE_PROPS, { nodeId: 'a', props: JSON.parse('{"__proto__":{"dragcraftPolluted":true}}') }],
    [CommandType.SET_GLOBAL_CONFIG, { config: JSON.parse('{"__proto__":{"dragcraftPolluted":true}}') }],
  ])('execute %s does not pollute object prototypes', (type, payload) => {
    const engine = createImportedEngine(makeSchema([makeNode('a')]))

    try {
      engine.execute({ type, payload })
      expect(({} as Record<string, unknown>).dragcraftPolluted).toBeUndefined()
    }
    finally {
      delete (Object.prototype as Record<string, unknown>).dragcraftPolluted
      engine.dispose()
    }
  })

  it('invalid MOVE_NODE does not push history or emit schema changed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createImportedEngine(makeSchema([makeNode('a')]))
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    engine.execute({
      type: CommandType.MOVE_NODE,
      payload: { nodeId: 'missing', destination: { kind: 'root', index: 0 } },
    })

    expect(engine.history.canUndo()).toBe(false)
    expect(schemaChanged).not.toHaveBeenCalled()
    warn.mockRestore()
    engine.dispose()
  })

  it('same-index MOVE_NODE does not push history or emit schema changed', () => {
    const engine = createImportedEngine(makeSchema([makeNode('a'), makeNode('b')]))
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    engine.execute({
      type: CommandType.MOVE_NODE,
      payload: { nodeId: 'a', destination: { kind: 'root', index: 0 } },
    })

    expect(engine.store.schema.value.root.children?.map(node => node.id)).toEqual(['a', 'b'])
    expect(engine.history.canUndo()).toBe(false)
    expect(schemaChanged).not.toHaveBeenCalled()
    engine.dispose()
  })

  it('invalid REMOVE_NODE does not push history or emit schema changed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createImportedEngine(makeSchema([makeNode('a')]))
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    engine.execute({ type: CommandType.REMOVE_NODE, payload: { nodeId: 'root' } })

    expect(engine.history.canUndo()).toBe(false)
    expect(schemaChanged).not.toHaveBeenCalled()
    warn.mockRestore()
    engine.dispose()
  })

  it('invalid UPDATE_PROPS does not push history or emit schema changed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createImportedEngine(makeSchema([makeNode('a')]))
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    engine.execute({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: 'missing', props: { label: 'ignored' } },
    })

    expect(engine.history.canUndo()).toBe(false)
    expect(schemaChanged).not.toHaveBeenCalled()
    warn.mockRestore()
    engine.dispose()
  })

  it('execute REMOVE_NODE removes a node', () => {
    const engine = createImportedEngine(makeSchema([makeNode('a'), makeNode('b')]))
    engine.execute({ type: CommandType.REMOVE_NODE, payload: { nodeId: 'a' } })
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    expect(engine.store.schema.value.root.children![0].id).toBe('b')
    engine.dispose()
  })

  it('executes one container variant migration with one history and event entry', () => {
    const engine = makeVariantEngine(({ state }) => ({
      allowed: true,
      state: {
        variant: 'stacked',
        regions: { body: [...state.regions.left, ...state.regions.right] },
      },
    }))
    const variantChanged = vi.fn()
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.CONTAINER_VARIANT_CHANGED, variantChanged)
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    const result = engine.execute({
      type: CommandType.CHANGE_CONTAINER_VARIANT,
      payload: { containerId: 'layout', variant: 'stacked' },
    })

    expect(result).toEqual({
      ok: true,
      eventPayload: {
        containerId: 'layout',
        fromVariant: 'split',
        toVariant: 'stacked',
      },
    })
    expect(engine.exportSchema().root.children![0].container!.variant).toBe('stacked')
    expect(engine.history.canUndo()).toBe(true)
    expect(variantChanged).toHaveBeenCalledOnce()
    if (!result.ok)
      throw new Error('expected variant migration to succeed')
    expect(variantChanged).toHaveBeenCalledWith(result.eventPayload)
    expect(schemaChanged).toHaveBeenCalledOnce()

    engine.history.undo()
    expect(engine.exportSchema().root.children![0].container!.variant).toBe('split')
    engine.dispose()
  })

  it('rejects invalid variant migration output without history or mutation events', () => {
    const engine = makeVariantEngine(() => undefined as never)
    const before = engine.exportSchema()
    const variantChanged = vi.fn()
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.CONTAINER_VARIANT_CHANGED, variantChanged)
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    const result = engine.execute({
      type: CommandType.CHANGE_CONTAINER_VARIANT,
      payload: { containerId: 'layout', variant: 'stacked' },
    })

    expect(result).toMatchObject({ ok: false, code: 'CONTAINER_VARIANT_MIGRATION_INVALID' })
    expect(engine.exportSchema()).toEqual(before)
    expect(engine.history.canUndo()).toBe(false)
    expect(variantChanged).not.toHaveBeenCalled()
    expect(schemaChanged).not.toHaveBeenCalled()
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
    const engine = createImportedEngine(makeSchema([makeNode('a')]))
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
    const result = engine.importSchema(newSchema)
    expect(result).toEqual({ ok: true, diagnostics: [] })
    expect(engine.store.schema.value.root.children).toHaveLength(2)
    expect(engine.store.schema.value.version).toBe('1.0.0')
    expect(engine.history.canUndo()).toBe(false)
    engine.dispose()
  })

  it('rejects an invalid import without replacing state, history, or emitting schema changes', () => {
    const engine = createEngine()
    registerSingleRegionContainer(engine)
    engine.execute({ type: CommandType.ADD_NODE, payload: { node: makeNode('current') } })
    const before = engine.exportSchema()
    const historyBefore = engine.history.state.value
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)
    const invalid = makeContainerNode()
    invalid.container!.regions.unknown = []

    const result = engine.importSchema(makeSchema([invalid]))

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: 'CONTAINER_REGION_UNKNOWN', severity: 'error' })],
    })
    expect(engine.exportSchema()).toEqual(before)
    expect(engine.history.state.value).toEqual(historyBefore)
    expect(engine.history.canUndo()).toBe(true)
    expect(schemaChanged).not.toHaveBeenCalled()
    engine.dispose()
  })

  it('imports unresolved containers with warning diagnostics', () => {
    const engine = createEngine()
    const schema = makeSchema([makeContainerNode('external-layout')])

    const result = engine.importSchema(schema)

    expect(result).toEqual({
      ok: true,
      diagnostics: [expect.objectContaining({
        code: 'UNRESOLVED_CONTAINER_TYPE',
        severity: 'warning',
        nodeId: 'layout',
      })],
    })
    expect(engine.exportSchema()).toEqual(schema)
    expect(engine.exportSchema().version).toBe('1.0.0')
    engine.dispose()
  })

  it('clones before migration and validation', () => {
    const engine = createEngine()
    const input = makeSchema()
    engine.registerMigration({
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      migrate: (schema) => {
        schema.version = '1.1.0'
        schema.globalConfig.migrated = true
        return schema
      },
    })

    const result = engine.importSchema(input)

    expect(result.ok).toBe(true)
    expect(input).toEqual(makeSchema())
    expect(engine.exportSchema().version).toBe('1.1.0')
    engine.dispose()
  })

  it('importSchema warns on invalid schema', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const engine = createEngine()
    const result = engine.importSchema({ version: '1.0.0', globalConfig: {}, root: null as any })
    expect(result).toEqual({
      ok: false,
      diagnostics: [{ code: 'SCHEMA_ENVELOPE_INVALID', severity: 'error' }],
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid schema'))
    warn.mockRestore()
    engine.dispose()
  })

  it.each([
    ['non-string version', {
      version: 1,
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: [] },
    } as unknown as DesignerSchema, 'SCHEMA_ENVELOPE_INVALID'],
    ['non-record global config', {
      version: '1.0.0',
      globalConfig: null,
      root: { id: 'root', type: 'root', props: {}, children: [] },
    } as unknown as DesignerSchema, 'SCHEMA_GLOBAL_CONFIG_INVALID'],
    ['root missing required node fields', {
      version: '1.0.0',
      globalConfig: {},
      root: {},
    } as unknown as DesignerSchema, 'SCHEMA_ROOT_INVALID'],
    ['null container regions', makeSchema([{
      id: 'layout',
      type: 'missing-layout',
      props: {},
      container: { variant: 'single', regions: null },
    } as unknown as SchemaNode]), 'CONTAINER_REGIONS_INVALID'],
    ['non-array root children', {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: null },
    } as unknown as DesignerSchema, 'SCHEMA_CHILDREN_INVALID'],
    ['non-array region children', makeSchema([{
      id: 'layout',
      type: 'missing-layout',
      props: {},
      container: { variant: 'single', regions: { content: {} } },
    } as unknown as SchemaNode]), 'CONTAINER_REGION_CHILDREN_INVALID'],
  ])('importSchema diagnoses %s without throwing', (_label, input, code) => {
    const engine = createImportedEngine(makeSchema([makeNode('current')]))
    const before = engine.exportSchema()

    const result = engine.importSchema(input)

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code, severity: 'error' })],
    })
    expect(engine.exportSchema()).toEqual(before)
    engine.dispose()
  })

  it('diagnoses malformed structure before running migrations', () => {
    const engine = createImportedEngine(makeSchema([makeNode('current')]))
    const migrate = vi.fn((schema: DesignerSchema) => ({
      ...schema,
      root: { ...schema.root, children: schema.root.children!.map(node => ({ ...node })) },
    }))
    engine.registerMigration({ fromVersion: '1.0.0', toVersion: '2.0.0', migrate })
    const before = engine.exportSchema()
    const input = {
      version: '1.0.0',
      globalConfig: {},
      root: { id: 'root', type: 'root', props: {}, children: null },
    } as unknown as DesignerSchema

    let result: ReturnType<typeof engine.importSchema> | undefined
    expect(() => {
      result = engine.importSchema(input)
    }).not.toThrow()
    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: 'SCHEMA_CHILDREN_INVALID', severity: 'error' })],
    })
    expect(migrate).not.toHaveBeenCalled()
    expect(engine.exportSchema()).toEqual(before)
    engine.dispose()
  })

  it('state.getSchema returns a deeply frozen snapshot', () => {
    const engine = createImportedEngine(makeSchema([makeNode('a')]))

    const snapshot = engine.state.getSchema()
    expect(() => (snapshot.root.children as SchemaNode[]).push(makeNode('b'))).toThrow(TypeError)

    expect(Object.isFrozen(snapshot.root.children)).toBe(true)
    expect(engine.store.schema.value.root.children).toHaveLength(1)
    expect(engine.state.getSchema().root.children).toHaveLength(1)
    engine.dispose()
  })

  it('state.getNodeById returns a deeply frozen snapshot', () => {
    const engine = createImportedEngine(makeSchema([makeNode('a')]))

    const node = engine.state.getNodeById('a')
    expect(() => {
      (node!.props as Record<string, unknown>).label = 'mutated'
    }).toThrow(TypeError)

    expect(Object.isFrozen(node!.props)).toBe(true)
    expect(engine.store.schema.value.root.children![0].props.label).toBeUndefined()
    engine.dispose()
  })

  it('state exposes runtime selection, hover, and drag target snapshots', () => {
    const engine = createEngine()

    engine.store.selectNode('selected')
    engine.store.hoverNode('hovered')
    engine.store.setDragTarget({ sourceNodeId: null, widgetType: 'text' })

    expect(engine.state.getSelectedNodeId()).toBe('selected')
    expect(engine.state.getHoveredNodeId()).toBe('hovered')
    expect(engine.state.getDragTarget()).toEqual({ sourceNodeId: null, widgetType: 'text' })
    engine.dispose()
  })

  it('exposes a runtime-safe public store interface', () => {
    const engine = createEngine()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    if (false) {
      // @ts-expect-error Schema replacement is only available inside core.
      engine.store.setSchema(makeSchema())
      // @ts-expect-error Raw schema access is only available inside core commands.
      engine.store.getRawSchema()
      // @ts-expect-error Manual reactive triggering is only available inside core.
      engine.store.triggerUpdate()
    }

    try {
      expect(engine.store).not.toHaveProperty('setSchema')
      expect(engine.store).not.toHaveProperty('getRawSchema')
      expect(engine.store).not.toHaveProperty('triggerUpdate')

      ;(engine.store.schema.value.root.props as Record<string, unknown>).mutated = true
      expect(engine.exportSchema().root.props.mutated).toBeUndefined()
    }
    finally {
      warn.mockRestore()
      engine.dispose()
    }
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
