import type { DesignerSchema, SchemaNode } from './types'
import { describe, expect, it } from 'vitest'
import { buildSchemaIndex, findIndexedNode } from './schema-index'

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
): SchemaNode {
  return {
    ...makeNode(id, 'layout'),
    container: { variant: 'default', regions },
  }
}

describe('buildSchemaIndex', () => {
  it('indexes root and region-owned nodes with one global ID namespace', () => {
    const schema = makeSchema([
      makeNode('plain'),
      makeContainer('layout', { left: [makeNode('nested')] }),
    ])

    const result = buildSchemaIndex(schema)

    expect(result.diagnostics).toEqual([])
    expect(result.index.get('plain')).toMatchObject({ owner: 'root', index: 0, depth: 1 })
    expect(result.index.get('nested')).toMatchObject({ owner: 'layout', regionId: 'left', index: 0, depth: 2 })
    expect(findIndexedNode(result, 'nested')?.node.id).toBe('nested')
  })

  it('reports duplicate IDs and nested containers', () => {
    const nestedContainer = makeContainer('nested-layout', { default: [] })
    const schema = makeSchema([
      makeContainer('layout', {
        left: [makeNode('dup'), makeNode('dup'), nestedContainer],
      }),
    ])

    expect(buildSchemaIndex(schema).diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'SCHEMA_NODE_ID_DUPLICATE',
      'SCHEMA_CONTAINER_NESTED',
    ]))
  })
})
