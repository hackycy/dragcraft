import type { DesignerSchema, SchemaNode, WidgetMeta } from './types'
import { describe, expect, it } from 'vitest'
import { createRegistry } from './registry'
import { validateSchema } from './schema-validation'

function makeSchema(children: SchemaNode[]): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: { id: 'root', type: 'root', props: {}, children },
  }
}

function makeNode(id: string, type = 'text'): SchemaNode {
  return { id, type, props: {} }
}

function makeContainer(
  id: string,
  regions: Record<string, SchemaNode[]>,
  variant = 'split',
  type = 'split-layout',
): SchemaNode {
  return {
    ...makeNode(id, type),
    container: { variant, regions },
  }
}

function makeMeta(type: string, overrides: Partial<WidgetMeta> = {}): WidgetMeta {
  return {
    type,
    title: type,
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  }
}

function makeRegistryWithSplitContainer() {
  const registry = createRegistry()
  registry.registerWidget(makeMeta('split-layout', {
    container: {
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
    },
  }))
  return registry
}

describe('validateSchema', () => {
  it('rejects a page node ID that collides with the document root ID', () => {
    const result = validateSchema(makeSchema([makeNode('root')]), createRegistry())

    expect(result.valid).toBe(false)
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'SCHEMA_NODE_ID_DUPLICATE',
      severity: 'error',
      nodeId: 'root',
    }))
  })

  it('canonicalizes only missing empty regions on a cloned schema', () => {
    const registry = makeRegistryWithSplitContainer()
    const schema = makeSchema([
      makeContainer('layout', { left: [] }),
    ])

    const result = validateSchema(schema, registry)

    expect(result.valid).toBe(true)
    expect(result.schema).not.toBe(schema)
    expect(result.schema.root.children![0].container!.regions).toEqual({ left: [], right: [] })
    expect(schema.root.children![0].container!.regions).toEqual({ left: [] })
  })

  it('preserves unresolved containers as warnings and rejects capability mismatches', () => {
    const unresolvedSchema = makeSchema([
      makeContainer('x', { custom: [makeNode('a')] }, 'v', 'missing-layout'),
    ])
    const unresolved = validateSchema(unresolvedSchema, createRegistry())

    expect(unresolved.valid).toBe(true)
    expect(unresolved.schema).toEqual(unresolvedSchema)
    expect(unresolved.diagnostics).toContainEqual(expect.objectContaining({
      code: 'UNRESOLVED_CONTAINER_TYPE',
      severity: 'warning',
    }))

    const registry = createRegistry()
    registry.registerWidget(makeMeta('ordinary'))
    const mismatch = validateSchema(
      makeSchema([makeContainer('x', { custom: [] }, 'v', 'ordinary')]),
      registry,
    )

    expect(mismatch.valid).toBe(false)
    expect(mismatch.diagnostics).toContainEqual(expect.objectContaining({
      code: 'CONTAINER_CAPABILITY_MISMATCH',
      severity: 'error',
    }))
  })

  it('rejects missing container state, unknown variants, and unknown regions without deleting data', () => {
    const registry = makeRegistryWithSplitContainer()
    const unknownRegion = makeContainer('unknown-region', {
      left: [],
      extra: [makeNode('kept')],
    })
    const result = validateSchema(makeSchema([
      makeNode('missing-state', 'split-layout'),
      makeContainer('unknown-variant', { left: [] }, 'missing'),
      unknownRegion,
    ]), registry)

    expect(result.valid).toBe(false)
    expect(result.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'CONTAINER_STATE_MISSING',
      'CONTAINER_VARIANT_UNKNOWN',
      'CONTAINER_REGION_UNKNOWN',
    ]))
    expect(result.schema.root.children![2].container!.regions.extra[0].id).toBe('kept')
  })

  it('rejects region cardinality and type constraint violations', () => {
    const registry = createRegistry()
    registry.registerWidget(makeMeta('constrained-layout', {
      container: {
        defaultVariant: 'default',
        variants: {
          default: {
            title: 'Default',
            regions: [
              { id: 'required', title: 'Required', constraints: { minItems: 1 } },
              { id: 'limited', title: 'Limited', constraints: { maxItems: 1 } },
              { id: 'included', title: 'Included', constraints: { includeTypes: ['allowed'] } },
              { id: 'excluded', title: 'Excluded', constraints: { excludeTypes: ['blocked'] } },
            ],
          },
        },
      },
    }))
    const result = validateSchema(makeSchema([
      makeContainer('layout', {
        required: [],
        limited: [makeNode('one'), makeNode('two')],
        included: [makeNode('not-allowed', 'other')],
        excluded: [makeNode('blocked', 'blocked')],
      }, 'default', 'constrained-layout'),
    ]), registry)

    expect(result.valid).toBe(false)
    expect(result.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'CONTAINER_REGION_MIN_ITEMS',
      'CONTAINER_REGION_MAX_ITEMS',
      'CONTAINER_TYPE_NOT_INCLUDED',
      'CONTAINER_TYPE_EXCLUDED',
    ]))
  })

  it('rejects nested container capability and page layout on region children', () => {
    const registry = makeRegistryWithSplitContainer()
    const nested = makeNode('nested', 'split-layout')
    nested.layout = { placement: { kind: 'flow' }, order: 1, visible: true }
    const result = validateSchema(makeSchema([
      makeContainer('layout', { left: [nested], right: [] }),
    ]), registry)

    expect(result.valid).toBe(false)
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'SCHEMA_CONTAINER_NESTED',
      nodeId: 'nested',
      ownerId: 'layout',
      regionId: 'left',
    }))
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'CONTAINER_CHILD_PAGE_LAYOUT_FORBIDDEN',
      nodeId: 'nested',
    }))
  })
})
