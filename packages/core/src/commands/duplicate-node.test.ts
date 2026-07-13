import type { ContainerDefinition, DesignerSchema, SchemaNode } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { CommandType, EventName } from '../constants'
import { createEngine } from '../engine'

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: { label: id } }
}

function makeContainer(id = 'layout'): SchemaNode {
  return {
    id,
    type: 'split-layout',
    props: { label: 'Split' },
    container: {
      variant: 'split',
      regions: { left: [makeNode('child')], right: [] },
    },
  }
}

function makeSchema(children: SchemaNode[]): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: { id: 'root', type: 'root', props: {}, children },
  }
}

const definition: ContainerDefinition = {
  defaultVariant: 'split',
  variants: {
    split: {
      title: 'Split',
      regions: [
        { id: 'left', title: 'Left' },
        { id: 'right', title: 'Right' },
      ],
    },
  },
}

function makeContainerEngine() {
  const engine = createEngine({ initialSchema: makeSchema([makeContainer(), makeNode('after')]) })
  engine.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
  })
  engine.registerWidget({
    type: 'split-layout',
    title: 'Split',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    container: definition,
  })
  return engine
}

describe('duplicate node command', () => {
  it('duplicates a container beside its source as one command', () => {
    const engine = makeContainerEngine()

    const result = engine.execute({
      type: CommandType.DUPLICATE_NODE,
      payload: { nodeId: 'layout' },
    })

    expect(result).toMatchObject({ ok: true })
    const [source, copy, after] = engine.exportSchema().root.children!
    expect(copy.type).toBe(source.type)
    expect(copy.id).not.toBe(source.id)
    expect(copy.container!.regions.left[0].id).not.toBe(source.container!.regions.left[0].id)
    expect(after.id).toBe('after')
    expect(engine.history.canUndo()).toBe(true)
  })

  it('emits one duplicate event with resolved IDs and one schema event', () => {
    const engine = makeContainerEngine()
    const duplicated = vi.fn()
    const schemaChanged = vi.fn()
    engine.eventHub.on(EventName.NODE_DUPLICATED, duplicated)
    engine.eventHub.on(EventName.SCHEMA_CHANGED, schemaChanged)

    const result = engine.execute({
      type: CommandType.DUPLICATE_NODE,
      payload: { nodeId: 'layout' },
    })

    expect(result).toMatchObject({
      ok: true,
      eventPayload: {
        sourceNodeId: 'layout',
        destination: { kind: 'root', index: 1 },
      },
    })
    expect(duplicated).toHaveBeenCalledOnce()
    if (!result.ok)
      throw new Error('expected duplication to succeed')
    expect(duplicated).toHaveBeenCalledWith(result.eventPayload)
    expect(schemaChanged).toHaveBeenCalledOnce()
  })

  it('duplicates beside its source without treating chrome as a content sibling', () => {
    const engine = makeContainerEngine()
    engine.store.getRawSchema().root.children!.unshift({
      ...makeNode('chrome'),
      layout: { placement: { kind: 'chrome', edge: 'block-end' } },
    })

    const result = engine.execute({
      type: CommandType.DUPLICATE_NODE,
      payload: { nodeId: 'layout' },
    })

    expect(result).toMatchObject({ ok: true })
    const children = engine.exportSchema().root.children!
    expect(children.map(node => node.id)).toEqual([
      'chrome',
      'layout',
      expect.not.stringMatching(/^(chrome|layout|after)$/),
      'after',
    ])
  })

  it('rejects duplication when adding the clone violates destination constraints', () => {
    const engine = makeContainerEngine()
    definition.variants.split.regions[0].constraints = { maxItems: 1 }
    const before = engine.exportSchema()

    const result = engine.execute({
      type: CommandType.DUPLICATE_NODE,
      payload: { nodeId: 'child' },
    })

    expect(result).toMatchObject({ ok: false, code: 'CONTAINER_REGION_MAX_ITEMS' })
    expect(engine.exportSchema()).toEqual(before)
    expect(engine.history.canUndo()).toBe(false)
    delete definition.variants.split.regions[0].constraints
  })

  it.each([
    ['container definition', (container: SchemaNode) => { container.type = 'missing-layout' }, 'layout'],
    ['owner definition', (container: SchemaNode) => { container.type = 'missing-layout' }, 'child'],
    ['active variant', (container: SchemaNode) => { container.container!.variant = 'missing' }, 'child'],
    ['source region', (container: SchemaNode) => {
      container.container!.regions.legacy = container.container!.regions.left
      delete container.container!.regions.left
    }, 'child'],
  ])('rejects an unresolved source %s before mutation', (_, makeUnresolved, nodeId) => {
    const engine = makeContainerEngine()
    makeUnresolved(engine.store.getRawSchema().root.children![0])
    const before = engine.exportSchema()

    const result = engine.execute({
      type: CommandType.DUPLICATE_NODE,
      payload: { nodeId },
    })

    expect(result).toEqual({ ok: false, code: 'UNRESOLVED_CONTAINER_READ_ONLY' })
    expect(engine.exportSchema()).toEqual(before)
    expect(engine.history.canUndo()).toBe(false)
  })
})
