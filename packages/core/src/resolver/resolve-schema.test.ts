import type { SchemaDefinitionSnapshot } from '../definitions/types'
import type { DocumentSchema } from '../document/types'
import type { ResolveSchemaOptions } from './resolve-schema'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { resolveSchema } from './resolve-schema'

const noDefinitions: SchemaDefinitionSnapshot = {
  revision: 1,
  types: new Map(),
}

function makeDefinitions(types: ReadonlyMap<string, object>): SchemaDefinitionSnapshot {
  return { revision: 1, types }
}

function makeEmptySchema(): DocumentSchema {
  return {
    version: '1',
    globalConfig: {},
    page: { props: {} },
    nodes: [],
    structure: {
      root: [],
      containers: {},
    },
  }
}

function makeUnknownSchema(count: number): DocumentSchema {
  const schema = makeEmptySchema()
  schema.nodes = Array.from({ length: count }, (_, index) => ({
    id: `node-${index}`,
    type: `unknown-${index}`,
    props: {},
  }))
  schema.structure.root = schema.nodes.map(node => node.id)
  return schema
}

describe('resolveSchema', () => {
  it('resolves the canonical empty document', () => {
    const schema = makeEmptySchema()

    const result = resolveSchema(schema, noDefinitions)

    expect(result).toMatchObject({
      status: 'ready',
      diagnostics: { items: [], truncated: false },
    })
    expect(result.status).toBe('ready')
    if (result.status !== 'ready')
      return
    expect(result.document.schema).toEqual(schema)
    expect(result.document.nodesById.size).toBe(0)
    expect(result.document.locationsById.size).toBe(0)
    expect(result.document.root).toEqual([])
    expect(result.document.containersById.size).toBe(0)
  })

  it('owns an input-isolated immutable document snapshot', () => {
    const schema = makeEmptySchema()
    schema.globalConfig = { locale: 'en', flags: ['stable'] }
    schema.page = { props: { title: 'Original' }, style: { color: 'red' } }

    const result = resolveSchema(schema, noDefinitions)

    expect(result.status).toBe('ready')
    if (result.status !== 'ready')
      return

    schema.globalConfig.locale = 'mutated'
    ;(schema.globalConfig.flags as string[]).push('mutated')
    schema.page.props.title = 'mutated'

    expect(result.document.schema).toEqual({
      ...makeEmptySchema(),
      globalConfig: { locale: 'en', flags: ['stable'] },
      page: { props: { title: 'Original' }, style: { color: 'red' } },
    })
    expect(Object.isFrozen(result.document.schema)).toBe(true)
    expect(Object.isFrozen(result.document.schema.globalConfig)).toBe(true)
    expect(Object.isFrozen(result.document.schema.globalConfig.flags)).toBe(true)
    expect(() => (result.document.nodesById as Map<string, unknown>).set('x', {})).toThrow(TypeError)
  })

  it('rejects executable values that cannot round-trip through JSON', () => {
    const schema = makeEmptySchema() as unknown as Record<string, unknown>
    const page = schema.page as { props: Record<string, unknown> }
    page.props.onClick = () => undefined

    const result = resolveSchema(schema, noDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [{
          code: 'JSON_VALUE_INVALID',
          phase: 'decode',
          severity: 'error',
          path: '/page/props/onClick',
        }],
        truncated: false,
      },
    })
    expect('document' in result).toBe(false)
  })

  it('rejects malformed document fields at their JSON Pointer paths', () => {
    const result = resolveSchema({
      version: 1,
      globalConfig: [],
      page: { props: {} },
      nodes: {},
      structure: null,
    }, noDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [
          { code: 'DOCUMENT_GLOBAL_CONFIG_INVALID', phase: 'decode', severity: 'error', path: '/globalConfig' },
          { code: 'DOCUMENT_NODES_INVALID', phase: 'decode', severity: 'error', path: '/nodes' },
          { code: 'DOCUMENT_STRUCTURE_INVALID', phase: 'decode', severity: 'error', path: '/structure' },
          { code: 'DOCUMENT_VERSION_INVALID', phase: 'decode', severity: 'error', path: '/version' },
        ],
        truncated: false,
      },
    })
  })

  it('rejects malformed node definitions and structural references', () => {
    const schema = makeEmptySchema() as unknown as Record<string, unknown>
    schema.nodes = [{ id: '', type: 42, props: [], style: [] }]
    schema.structure = {
      root: ['valid', 3],
      containers: {
        owner: { regions: { main: ['valid', false] } },
      },
    }

    const result = resolveSchema(schema, noDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [
          { code: 'NODE_ID_INVALID', phase: 'decode', severity: 'error', path: '/nodes/0/id' },
          { code: 'NODE_PROPS_INVALID', phase: 'decode', severity: 'error', path: '/nodes/0/props' },
          { code: 'NODE_STYLE_INVALID', phase: 'decode', severity: 'error', path: '/nodes/0/style' },
          { code: 'NODE_TYPE_INVALID', phase: 'decode', severity: 'error', path: '/nodes/0/type' },
          { code: 'NODE_REFERENCE_INVALID', phase: 'decode', severity: 'error', path: '/structure/containers/owner/regions/main/1' },
          { code: 'NODE_REFERENCE_INVALID', phase: 'decode', severity: 'error', path: '/structure/root/1' },
        ],
        truncated: false,
      },
    })
  })

  it('indexes root-owned nodes in their structural order', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'hero', type: 'text', props: { value: 'Hello' } }]
    schema.structure.root = ['hero']

    const result = resolveSchema(schema, makeDefinitions(new Map([['text', {}]])))

    expect(result.status).toBe('ready')
    if (result.status !== 'ready')
      return
    const resolvedNode = result.document.nodesById.get('hero')
    expect(resolvedNode).toEqual({
      node: { id: 'hero', type: 'text', props: { value: 'Hello' } },
      state: 'resolved',
      readOnly: false,
    })
    expect(result.document.root).toEqual([resolvedNode])
    expect(result.document.root[0]).toBe(resolvedNode)
    expect(result.document.locationsById.get('hero')).toEqual({ kind: 'page-root', index: 0 })
  })

  it('rejects duplicate node identities', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'duplicate', type: 'text', props: {} },
      { id: 'duplicate', type: 'text', props: {} },
    ]
    schema.structure.root = ['duplicate']

    const result = resolveSchema(schema, makeDefinitions(new Map([['text', {}]])))

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [{
          code: 'NODE_ID_DUPLICATE',
          phase: 'structure',
          severity: 'error',
          path: '/nodes/1/id',
          nodeId: 'duplicate',
        }],
        truncated: false,
      },
    })
  })

  it('rejects structural references to missing nodes', () => {
    const schema = makeEmptySchema()
    schema.structure.root = ['missing']

    const result = resolveSchema(schema, noDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [{
          code: 'NODE_REFERENCE_MISSING',
          phase: 'structure',
          severity: 'error',
          path: '/structure/root/0',
          nodeId: 'missing',
        }],
        truncated: false,
      },
    })
  })

  it('rejects nodes without structural ownership', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'orphan', type: 'text', props: {} }]

    const result = resolveSchema(schema, makeDefinitions(new Map([['text', {}]])))

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [{
          code: 'NODE_ORPHANED',
          phase: 'structure',
          severity: 'error',
          path: '/nodes/0',
          nodeId: 'orphan',
        }],
        truncated: false,
      },
    })
  })

  it('rejects multiple structural ownership references', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'repeated', type: 'text', props: {} }]
    schema.structure.root = ['repeated', 'repeated']

    const result = resolveSchema(schema, makeDefinitions(new Map([['text', {}]])))

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [{
          code: 'NODE_MULTIPLE_OWNERS',
          phase: 'structure',
          severity: 'error',
          path: '/structure/root/1',
          nodeId: 'repeated',
        }],
        truncated: false,
      },
    })
  })

  it('resolves one-level container regions and child locations', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'layout', type: 'split', props: {} },
      { id: 'left-copy', type: 'text', props: { value: 'Left' } },
      { id: 'right-copy', type: 'text', props: { value: 'Right' } },
    ]
    schema.structure.root = ['layout']
    schema.structure.containers = {
      layout: { regions: { left: ['left-copy'], right: ['right-copy'] } },
    }
    const definitions = makeDefinitions(new Map([
      ['split', { container: { regions: [{ id: 'left' }, { id: 'right' }] } }],
      ['text', {}],
    ]))

    const result = resolveSchema(schema, definitions)

    expect(result.status).toBe('ready')
    if (result.status !== 'ready')
      return
    expect(result.document.root.map(item => item.node.id)).toEqual(['layout'])
    expect(result.document.locationsById.get('left-copy')).toEqual({
      kind: 'container-region',
      containerId: 'layout',
      regionId: 'left',
      index: 0,
    })
    expect(result.document.containersById.get('layout')?.regions.get('left')?.children.map(item => item.node.id)).toEqual(['left-copy'])
    expect(result.document.containersById.get('layout')?.regions.get('right')?.children.map(item => item.node.id)).toEqual(['right-copy'])
  })

  it('rejects a container owner that is owned by another container region', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'outer', type: 'split', props: {} },
      { id: 'nested', type: 'split', props: {} },
    ]
    schema.structure.root = ['outer']
    schema.structure.containers = {
      outer: { regions: { main: ['nested'] } },
      nested: { regions: { main: [] } },
    }
    const definitions = makeDefinitions(new Map([
      ['split', { container: { regions: [{ id: 'main' }] } }],
    ]))

    const result = resolveSchema(schema, definitions)

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [{
          code: 'CONTAINER_OWNER_NOT_ROOT',
          phase: 'structure',
          severity: 'error',
          path: '/structure/containers/nested',
          containerId: 'nested',
        }],
        truncated: false,
      },
    })
  })

  it('rejects missing container owners and region children', () => {
    const schema = makeEmptySchema()
    schema.structure.containers = {
      ghost: { regions: { main: ['missing-child'] } },
    }

    const result = resolveSchema(schema, noDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [
          {
            code: 'CONTAINER_OWNER_MISSING',
            phase: 'structure',
            severity: 'error',
            path: '/structure/containers/ghost',
            containerId: 'ghost',
          },
          {
            code: 'NODE_REFERENCE_MISSING',
            phase: 'structure',
            severity: 'error',
            path: '/structure/containers/ghost/regions/main/0',
            nodeId: 'missing-child',
            containerId: 'ghost',
            regionId: 'main',
          },
        ],
        truncated: false,
      },
    })
  })

  it('degrades unknown node types without discarding the document', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'future', type: 'future-widget', props: { kept: true } }]
    schema.structure.root = ['future']

    const result = resolveSchema(schema, noDefinitions)

    expect(result.status).toBe('degraded')
    if (result.status !== 'degraded')
      return
    expect(result.diagnostics).toEqual({
      items: [{
        code: 'NODE_TYPE_UNRESOLVED',
        phase: 'definition',
        severity: 'warning',
        path: '/nodes/0/type',
        nodeId: 'future',
      }],
      truncated: false,
    })
    expect(result.document.nodesById.get('future')).toEqual({
      node: { id: 'future', type: 'future-widget', props: { kept: true } },
      state: 'unresolved',
      readOnly: true,
    })
  })

  it('conflicts when a registered ordinary type owns container structure', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'ordinary', type: 'text', props: {} }]
    schema.structure.root = ['ordinary']
    schema.structure.containers = {
      ordinary: { regions: { unexpected: [] } },
    }

    const result = resolveSchema(schema, makeDefinitions(new Map([['text', {}]])))

    expect(result.status).toBe('conflicted')
    if (result.status !== 'conflicted')
      return
    expect(result.diagnostics).toEqual({
      items: [{
        code: 'CONTAINER_CAPABILITY_MISMATCH',
        phase: 'definition',
        severity: 'error',
        path: '/structure/containers/ordinary',
        nodeId: 'ordinary',
        containerId: 'ordinary',
      }],
      truncated: false,
    })
    expect(result.document.nodesById.get('ordinary')?.state).toBe('conflicted')
    expect(result.document.nodesById.get('ordinary')?.readOnly).toBe(true)
  })

  it('conflicts when a registered container type lacks container structure', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'layout', type: 'split', props: {} }]
    schema.structure.root = ['layout']
    const definitions = makeDefinitions(new Map([
      ['split', { container: { regions: [{ id: 'main' }] } }],
    ]))

    const result = resolveSchema(schema, definitions)

    expect(result.status).toBe('conflicted')
    if (result.status !== 'conflicted')
      return
    expect(result.diagnostics).toEqual({
      items: [{
        code: 'CONTAINER_STRUCTURE_MISSING',
        phase: 'definition',
        severity: 'error',
        path: '/nodes/0',
        nodeId: 'layout',
        containerId: 'layout',
      }],
      truncated: false,
    })
    expect(result.document.schema).toEqual(schema)
    expect(result.document.nodesById.get('layout')?.state).toBe('conflicted')
  })

  it('conflicts when container region keys differ from the declaration', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'layout', type: 'split', props: {} }]
    schema.structure.root = ['layout']
    schema.structure.containers = {
      layout: { regions: { left: [], extra: [] } },
    }
    const definitions = makeDefinitions(new Map([
      ['split', { container: { regions: [{ id: 'left' }, { id: 'right' }] } }],
    ]))

    const result = resolveSchema(schema, definitions)

    expect(result.status).toBe('conflicted')
    if (result.status !== 'conflicted')
      return
    expect(result.diagnostics).toEqual({
      items: [
        {
          code: 'CONTAINER_REGION_UNKNOWN',
          phase: 'definition',
          severity: 'error',
          path: '/structure/containers/layout/regions/extra',
          nodeId: 'layout',
          containerId: 'layout',
          regionId: 'extra',
        },
        {
          code: 'CONTAINER_REGION_MISSING',
          phase: 'definition',
          severity: 'error',
          path: '/structure/containers/layout/regions/right',
          nodeId: 'layout',
          containerId: 'layout',
          regionId: 'right',
        },
      ],
      truncated: false,
    })
    expect(result.document.schema.structure.containers.layout.regions).toEqual({ left: [], extra: [] })
    expect(result.document.nodesById.get('layout')?.readOnly).toBe(true)
  })

  it('conflicts when a region child has registered container capability', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'outer', type: 'split', props: {} },
      { id: 'nested', type: 'split', props: {} },
    ]
    schema.structure.root = ['outer']
    schema.structure.containers = {
      outer: { regions: { main: ['nested'] } },
    }
    const definitions = makeDefinitions(new Map([
      ['split', { container: { regions: [{ id: 'main' }] } }],
    ]))

    const result = resolveSchema(schema, definitions)

    expect(result.status).toBe('conflicted')
    if (result.status !== 'conflicted')
      return
    expect(result.diagnostics).toEqual({
      items: [{
        code: 'REGION_CHILD_CONTAINER_FORBIDDEN',
        phase: 'definition',
        severity: 'error',
        path: '/structure/containers/outer/regions/main/0',
        nodeId: 'nested',
        containerId: 'outer',
        regionId: 'main',
      }],
      truncated: false,
    })
    expect(result.document.nodesById.get('nested')?.state).toBe('conflicted')
  })

  it('conflicts on region cardinality and accepted type violations', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'layout', type: 'constrained', props: {} },
      { id: 'one', type: 'text', props: {} },
      { id: 'two', type: 'text', props: {} },
      { id: 'bad', type: 'other', props: {} },
    ]
    schema.structure.root = ['layout']
    schema.structure.containers = {
      layout: {
        regions: {
          required: [],
          limited: ['one', 'two'],
          typed: ['bad'],
        },
      },
    }
    const definitions = makeDefinitions(new Map([
      ['constrained', {
        container: {
          regions: [
            { id: 'required', cardinality: { min: 1 } },
            { id: 'limited', cardinality: { max: 1 } },
            { id: 'typed', accepts: { types: ['allowed'] } },
          ],
        },
      }],
      ['text', {}],
      ['other', {}],
      ['allowed', {}],
    ]))

    const result = resolveSchema(schema, definitions)

    expect(result.status).toBe('conflicted')
    if (result.status !== 'conflicted')
      return
    expect(result.diagnostics).toEqual({
      items: [
        {
          code: 'REGION_CARDINALITY_MAX',
          phase: 'definition',
          severity: 'error',
          path: '/structure/containers/layout/regions/limited',
          nodeId: 'layout',
          containerId: 'layout',
          regionId: 'limited',
          details: { actual: 2, max: 1 },
        },
        {
          code: 'REGION_CARDINALITY_MIN',
          phase: 'definition',
          severity: 'error',
          path: '/structure/containers/layout/regions/required',
          nodeId: 'layout',
          containerId: 'layout',
          regionId: 'required',
          details: { actual: 0, min: 1 },
        },
        {
          code: 'REGION_TYPE_NOT_ACCEPTED',
          phase: 'definition',
          severity: 'error',
          path: '/structure/containers/layout/regions/typed/0',
          nodeId: 'bad',
          containerId: 'layout',
          regionId: 'typed',
          details: { actualType: 'other', acceptedTypes: ['allowed'] },
        },
      ],
      truncated: false,
    })
    expect(result.document.nodesById.get('layout')?.readOnly).toBe(true)
    expect(result.document.nodesById.get('bad')?.readOnly).toBe(true)
  })

  it('keeps resolution status independent from a zero diagnostic budget', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'ordinary', type: 'text', props: {} }]
    schema.structure.root = ['ordinary']
    schema.structure.containers = {
      ordinary: { regions: { unexpected: [] } },
    }

    const result = resolveSchema(
      schema,
      makeDefinitions(new Map([['text', {}]])),
      { maxDiagnostics: 0 },
    )

    expect(result.status).toBe('conflicted')
    expect(result.diagnostics).toEqual({ items: [], truncated: true })
  })

  it('uses the default diagnostic budget for omitted and invalid values', () => {
    const schema = makeUnknownSchema(201)
    const invalidValues: unknown[] = [-2, 1.5, Number.POSITIVE_INFINITY, Number.NaN, '2']

    const omitted = resolveSchema(schema, noDefinitions)
    expect(omitted.status).toBe('degraded')
    expect(omitted.diagnostics.items).toHaveLength(200)
    expect(omitted.diagnostics.truncated).toBe(true)

    for (const maxDiagnostics of invalidValues) {
      const result = resolveSchema(
        schema,
        noDefinitions,
        { maxDiagnostics } as ResolveSchemaOptions,
      )
      expect(result.status).toBe('degraded')
      expect(result.diagnostics.items).toHaveLength(200)
      expect(result.diagnostics.truncated).toBe(true)
    }
  })

  it('caps the diagnostic budget at 2000 without treating the cap as truncation', () => {
    const overLimit = resolveSchema(
      makeUnknownSchema(2001),
      noDefinitions,
      { maxDiagnostics: 9999 },
    )
    expect(overLimit.status).toBe('degraded')
    expect(overLimit.diagnostics.items).toHaveLength(2000)
    expect(overLimit.diagnostics.truncated).toBe(true)

    const belowLimit = resolveSchema(
      makeUnknownSchema(1),
      noDefinitions,
      { maxDiagnostics: 9999 },
    )
    expect(belowLimit.diagnostics.items).toHaveLength(1)
    expect(belowLimit.diagnostics.truncated).toBe(false)
  })

  it('returns an immutable diagnostic report', () => {
    const result = resolveSchema(makeUnknownSchema(1), noDefinitions)

    expect(result.status).toBe('degraded')
    expect(Object.isFrozen(result.diagnostics)).toBe(true)
    expect(Object.isFrozen(result.diagnostics.items)).toBe(true)
    expect(Object.isFrozen(result.diagnostics.items[0])).toBe(true)
    expect(() => (result.diagnostics.items as unknown[]).push({})).toThrow(TypeError)
  })

  it('rejects array accessors without executing them', () => {
    const schema = makeEmptySchema() as unknown as Record<string, unknown>
    const page = schema.page as { props: Record<string, unknown> }
    const values: unknown[] = []
    let getterCalls = 0
    Object.defineProperty(values, 0, {
      enumerable: true,
      get() {
        getterCalls++
        return 'executed'
      },
    })
    page.props.values = values

    const result = resolveSchema(schema, noDefinitions)

    expect(getterCalls).toBe(0)
    expect(result).toEqual({
      status: 'rejected',
      diagnostics: {
        items: [{
          code: 'JSON_VALUE_INVALID',
          phase: 'decode',
          severity: 'error',
          path: '/page/props/values/0',
        }],
        truncated: false,
      },
    })
  })

  it('orders diagnostics independently from the host locale', () => {
    fc.assert(fc.property(
      fc.constantFrom(['A', 'a'], ['Z', 'a'], ['a', 'B']),
      ([firstRegionId, secondRegionId]) => {
        const schema = makeEmptySchema()
        schema.nodes = [{ id: 'layout', type: 'container', props: {} }]
        schema.structure.root = ['layout']
        schema.structure.containers = {
          layout: {
            regions: Object.fromEntries([
              [firstRegionId, []],
              [secondRegionId, []],
            ]),
          },
        }
        const definitions = makeDefinitions(new Map([
          ['container', { container: { regions: [] } }],
        ]))

        const result = resolveSchema(schema, definitions)

        const expectedPaths = [firstRegionId, secondRegionId]
          .map(regionId => `/structure/containers/layout/regions/${regionId}`)
          .sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
        expect(result.diagnostics.items.map(item => item.path)).toEqual(expectedPaths)
      },
    ), { numRuns: 20, seed: 20260806, verbose: true })
  })

  it('orders registered container regions by declaration order', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'layout', type: 'split', props: {} }]
    schema.structure.root = ['layout']
    schema.structure.containers = {
      layout: { regions: { left: [], right: [] } },
    }
    const definitions = makeDefinitions(new Map([
      ['split', { container: { regions: [{ id: 'right' }, { id: 'left' }] } }],
    ]))

    const result = resolveSchema(schema, definitions)

    expect(result.status).toBe('ready')
    if (result.status !== 'ready')
      return
    expect([...result.document.containersById.get('layout')!.regions.keys()]).toEqual(['right', 'left'])
  })

  it('preserves ownership and order for generated legal one-level documents', () => {
    fc.assert(fc.property(
      fc.record({
        rootCount: fc.integer({ min: 0, max: 5 }),
        leftCount: fc.integer({ min: 0, max: 5 }),
        rightCount: fc.integer({ min: 0, max: 5 }),
        reverseDefinitions: fc.boolean(),
      }),
      ({ rootCount, leftCount, rightCount, reverseDefinitions }) => {
        const rootIds = Array.from({ length: rootCount }, (_, index) => `root-${index}`)
        const leftIds = Array.from({ length: leftCount }, (_, index) => `left-${index}`)
        const rightIds = Array.from({ length: rightCount }, (_, index) => `right-${index}`)
        const schema = makeEmptySchema()
        const nodes = [
          { id: 'layout', type: 'split', props: {} },
          ...rootIds.map(id => ({ id, type: 'text', props: {} })),
          ...leftIds.map(id => ({ id, type: 'text', props: {} })),
          ...rightIds.map(id => ({ id, type: 'text', props: {} })),
        ]
        schema.nodes = reverseDefinitions ? nodes.reverse() : nodes
        schema.structure.root = [...rootIds, 'layout']
        schema.structure.containers = {
          layout: { regions: { left: leftIds, right: rightIds } },
        }
        const before = JSON.stringify(schema)
        const definitions = makeDefinitions(new Map([
          ['split', { container: { regions: [{ id: 'left' }, { id: 'right' }] } }],
          ['text', {}],
        ]))

        const result = resolveSchema(schema, definitions)

        expect(result.status).toBe('ready')
        if (result.status !== 'ready')
          return
        expect(JSON.stringify(schema)).toBe(before)
        expect(result.document.nodesById.size).toBe(schema.nodes.length)
        expect(result.document.root.map(item => item.node.id)).toEqual([...rootIds, 'layout'])
        expect(result.document.containersById.get('layout')?.regions.get('left')?.children.map(item => item.node.id)).toEqual(leftIds)
        expect(result.document.containersById.get('layout')?.regions.get('right')?.children.map(item => item.node.id)).toEqual(rightIds)
        for (const [index, nodeId] of leftIds.entries()) {
          expect(result.document.locationsById.get(nodeId)).toEqual({
            kind: 'container-region',
            containerId: 'layout',
            regionId: 'left',
            index,
          })
        }
      },
    ), { numRuns: 50, seed: 20260806, verbose: true })
  })
})
