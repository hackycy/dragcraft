import type { DesignerSchema, SchemaNode, WidgetMeta } from './types'
import { describe, expect, it, vi } from 'vitest'
import {
  isWidgetVisibleInMaterialPanel,
  resolveAuthoringCapability,
  resolveAuthoringPolicy,
  resolveWidgetCreation,
  validateAuthoringTransition,
  validateSubtreeCreation,
  validateSubtreeDeletion,
} from './authoring-policy'
import { createRegistry } from './registry'

function makeNode(id: string, type = 'managed'): SchemaNode {
  return { id, type, props: {} }
}

function makeSchema(children: SchemaNode[] = []): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: { id: 'root', type: 'root', props: {}, children },
  }
}

function makeMeta(overrides: Partial<WidgetMeta> = {}): WidgetMeta {
  return {
    type: 'managed',
    title: 'Managed',
    group: 'g',
    defaultProps: {},
    formSchema: { sections: [] },
    authoring: 'schema-managed',
    ...overrides,
  }
}

describe('schema-managed authoring policy', () => {
  it('resolves the schema-managed default matrix', () => {
    const schema = makeSchema([makeNode('managed')])
    const node = schema.root.children![0]
    const meta = makeMeta()

    expect(resolveAuthoringPolicy(meta, { node, schema })).toEqual({
      schemaManaged: true,
      materialVisible: false,
      duplicable: false,
      selectable: true,
      configurable: true,
      draggable: false,
      sortable: true,
      deletable: false,
      variantChangeable: false,
    })
    expect(isWidgetVisibleInMaterialPanel(meta)).toBe(false)
    expect(resolveWidgetCreation(meta, { widgetType: meta.type, schema })).toEqual({
      allowed: false,
      code: 'SCHEMA_MANAGED_CREATION_FORBIDDEN',
    })
  })

  it('preserves ordinary widget defaults', () => {
    const schema = makeSchema([makeNode('ordinary', 'ordinary')])
    const node = schema.root.children![0]
    const meta = makeMeta({ type: 'ordinary', authoring: undefined })

    expect(resolveAuthoringPolicy(meta, { node, schema })).toMatchObject({
      schemaManaged: false,
      materialVisible: true,
      duplicable: true,
      selectable: true,
      configurable: true,
      draggable: true,
      sortable: true,
      deletable: true,
      variantChangeable: true,
    })
  })

  it('supports per-instance overrides while keeping creation and duplication invariant', () => {
    const schema = makeSchema([makeNode('managed')])
    const node = schema.root.children![0]
    const meta = makeMeta({
      selectable: false,
      configurable: ({ node }) => node.id === 'managed',
      draggable: true,
      sortable: false,
      deletable: true,
      variantChangeable: true,
      creatable: true,
    })

    expect(resolveAuthoringPolicy(meta, { node, schema })).toMatchObject({
      selectable: false,
      configurable: true,
      draggable: true,
      sortable: false,
      deletable: true,
      variantChangeable: true,
      duplicable: false,
    })
    expect(resolveWidgetCreation(meta, { widgetType: meta.type, schema }).allowed).toBe(false)
  })

  it('fails closed when an authoring predicate throws or returns an illegal value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const schema = makeSchema([makeNode('managed')])
    const node = schema.root.children![0]
    const meta = makeMeta({
      configurable: () => { throw new Error('broken') },
      deletable: (() => 'yes') as never,
    })

    const policy = resolveAuthoringPolicy(meta, { node, schema })

    expect(policy.configurable).toBe(false)
    expect(policy.deletable).toBe(false)
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  it('resolves one capability without evaluating unrelated predicates', () => {
    const schema = makeSchema([makeNode('managed')])
    const node = schema.root.children![0]
    const sortable = vi.fn(() => true)
    const configurable = vi.fn(() => true)
    const meta = makeMeta({ sortable, configurable })

    expect(resolveAuthoringCapability(meta, { node, schema }, 'sortable')).toBe(true)
    expect(sortable).toHaveBeenCalledOnce()
    expect(configurable).not.toHaveBeenCalled()
  })

  it('propagates creation and deletion decisions through a candidate subtree', () => {
    const registry = createRegistry()
    registry.registerWidget(makeMeta())
    registry.registerWidget(makeMeta({ type: 'container', authoring: undefined }))
    const container: SchemaNode = {
      id: 'container',
      type: 'container',
      props: {},
      container: { variant: 'single', regions: { content: [makeNode('managed-child')] } },
    }
    const schema = makeSchema()

    expect(validateSubtreeCreation(container, schema, registry)).toEqual({
      ok: false,
      code: 'SCHEMA_MANAGED_CREATION_FORBIDDEN',
      details: { nodeId: 'managed-child', widgetType: 'managed' },
    })
    expect(validateSubtreeDeletion(container, makeSchema([container]), registry)).toEqual({
      ok: false,
      code: 'NODE_NOT_DELETABLE',
      details: { nodeId: 'managed-child', widgetType: 'managed' },
    })
  })

  it('checks newly introduced and removed nodes across a schema transition', () => {
    const registry = createRegistry()
    registry.registerWidget(makeMeta())
    const before = makeSchema([])
    const after = makeSchema([makeNode('managed')])

    expect(validateAuthoringTransition(before, after, registry)).toMatchObject({
      ok: false,
      code: 'SCHEMA_MANAGED_CREATION_FORBIDDEN',
    })
    expect(validateAuthoringTransition(after, before, registry)).toMatchObject({
      ok: false,
      code: 'NODE_NOT_DELETABLE',
    })
  })
})
