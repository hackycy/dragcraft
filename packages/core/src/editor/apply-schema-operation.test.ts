import type { SchemaDefinitionSnapshot } from '../definitions/types'
import type { DocumentSchema } from '../document/types'
import type { OperationBatch } from './schema-operation'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { resolveSchema } from '../resolver/resolve-schema'
import { applySchemaOperation } from './apply-schema-operation'

const definitions: SchemaDefinitionSnapshot = {
  revision: 1,
  types: new Map(),
}

const textDefinitions: SchemaDefinitionSnapshot = {
  revision: 1,
  types: new Map([['text', {}]]),
}

const containerDefinitions: SchemaDefinitionSnapshot = {
  revision: 1,
  types: new Map([
    ['text', {}],
    ['stack', { container: { regions: [{ id: 'main' }] } }],
  ]),
}

const multiRegionDefinitions: SchemaDefinitionSnapshot = {
  revision: 1,
  types: new Map([
    ['text', {}],
    ['columns', { container: { regions: [{ id: 'primary' }, { id: 'secondary' }] } }],
  ]),
}

const constrainedDefinitions: SchemaDefinitionSnapshot = {
  revision: 1,
  types: new Map([
    ['text', {}],
    ['image', {}],
    ['limited', {
      container: {
        regions: [{
          id: 'main',
          accepts: { types: ['text'] },
          cardinality: { max: 1 },
        }],
      },
    }],
  ]),
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

function resolveReady(schema: DocumentSchema) {
  const result = resolveSchema(schema, definitions)
  if (result.status !== 'ready')
    throw new Error(`Expected ready document, received ${result.status}`)
  return result.document
}

describe('applySchemaOperation', () => {
  it('replaces global configuration in one committed edit', () => {
    const schema = makeEmptySchema()
    schema.globalConfig = { locale: 'en' }
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'update-global-config',
      globalConfig: { locale: 'zh-CN' },
    }, definitions)

    expect(result.status === 'committed' && result.document.schema.globalConfig).toEqual({ locale: 'zh-CN' })
  })

  it('keeps the original document reference when global configuration is unchanged', () => {
    const schema = makeEmptySchema()
    schema.globalConfig = { locale: 'en' }
    const document = resolveReady(schema)

    const result = applySchemaOperation(document, {
      type: 'update-global-config',
      globalConfig: { locale: 'en' },
    }, definitions)

    expect(result).toEqual({ status: 'unchanged', document })
  })

  it('treats JSON object key order as irrelevant to unchanged data', () => {
    const schema = makeEmptySchema()
    schema.globalConfig = { first: 1, second: 2 }
    const document = resolveReady(schema)

    const result = applySchemaOperation(document, {
      type: 'update-global-config',
      globalConfig: { second: 2, first: 1 },
    }, definitions)

    expect(result).toEqual({ status: 'unchanged', document })
  })

  it('replaces page data without changing the document structure', () => {
    const schema = makeEmptySchema()
    schema.page = { props: { title: 'Before' } }
    const document = resolveReady(schema)

    const result = applySchemaOperation(document, {
      type: 'update-page',
      page: { props: { title: 'After' }, style: { color: 'red' } },
    }, definitions)

    expect(result.status === 'committed' && result.document.schema.page).toEqual({
      props: { title: 'After' },
      style: { color: 'red' },
    })
  })

  it('replaces node data while preserving its identity and ownership', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'headline', type: 'text', props: { value: 'Before' } }]
    schema.structure.root = ['headline']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'update-node',
      nodeId: 'headline',
      node: { type: 'text', props: { value: 'After' }, style: { color: 'red' } },
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema.nodes[0]).toEqual({
      id: 'headline',
      type: 'text',
      props: { value: 'After' },
      style: { color: 'red' },
    })
  })

  it('rejects an update for a missing node without exposing a working document', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'update-node',
      nodeId: 'missing',
      node: { type: 'text', props: {} },
    }, definitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'NODE_NOT_FOUND',
      details: { nodeId: 'missing' },
    })
  })

  it('keeps the original document reference when node data is unchanged', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'headline', type: 'text', props: { value: 'Same' } }]
    schema.structure.root = ['headline']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'update-node',
      nodeId: 'headline',
      node: { type: 'text', props: { value: 'Same' } },
    }, textDefinitions)

    expect(result).toEqual({ status: 'unchanged', document })
  })

  it('inserts a standalone bundle at the start of the page root', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'existing', type: 'text', props: { value: 'Existing' } }]
    schema.structure.root = ['existing']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: {
        entryId: 'new',
        nodes: [{ id: 'new', type: 'text', props: { value: 'New' } }],
        containers: {},
      },
      to: { owner: { kind: 'page-root' }, position: { kind: 'start' } },
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure.root).toEqual(['new', 'existing'])
    expect(result.status === 'committed' && result.document.schema.nodes).toContainEqual({
      id: 'new',
      type: 'text',
      props: { value: 'New' },
    })
  })

  it('inserts a bundle at the end of the page root', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'existing', type: 'text', props: {} }]
    schema.structure.root = ['existing']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure.root).toEqual(['existing', 'new'])
  })

  it('inserts a bundle immediately before a root anchor', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'first', type: 'text', props: {} },
      { id: 'second', type: 'text', props: {} },
    ]
    schema.structure.root = ['first', 'second']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
      to: { owner: { kind: 'page-root' }, position: { kind: 'before', nodeId: 'second' } },
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure.root).toEqual(['first', 'new', 'second'])
  })

  it('inserts a bundle immediately after a root anchor', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'first', type: 'text', props: {} },
      { id: 'second', type: 'text', props: {} },
    ]
    schema.structure.root = ['first', 'second']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
      to: { owner: { kind: 'page-root' }, position: { kind: 'after', nodeId: 'first' } },
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure.root).toEqual(['first', 'new', 'second'])
  })

  it('inserts a bundle at the end of a container region', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'stack', props: {} },
      { id: 'existing', type: 'text', props: {} },
    ]
    schema.structure.root = ['container']
    schema.structure.containers = { container: { regions: { main: ['existing'] } } }
    const document = (() => {
      const result = resolveSchema(schema, containerDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
      to: {
        owner: { kind: 'container-region', containerId: 'container', regionId: 'main' },
        position: { kind: 'end' },
      },
    }, containerDefinitions)

    expect(result.status === 'committed'
      && result.document.schema.structure.containers.container.regions.main).toEqual(['existing', 'new'])
  })

  it('rejects an insertion whose anchor is not in the target owner sequence', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
      to: { owner: { kind: 'page-root' }, position: { kind: 'before', nodeId: 'missing' } },
    }, textDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'DESTINATION_ANCHOR_NOT_FOUND',
      details: { nodeId: 'missing' },
    })
  })

  it('rejects an insertion whose destination region does not exist', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
      to: {
        owner: { kind: 'container-region', containerId: 'missing', regionId: 'main' },
        position: { kind: 'end' },
      },
    }, textDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'DESTINATION_OWNER_NOT_FOUND',
      details: { containerId: 'missing', regionId: 'main' },
    })
  })

  it('inserts a complete container aggregate as one bundle', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: {
        entryId: 'container',
        nodes: [
          { id: 'container', type: 'stack', props: {} },
          { id: 'child', type: 'text', props: { value: 'Nested' } },
        ],
        containers: { container: { regions: { main: ['child'] } } },
      },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, containerDefinitions)

    expect(result.status === 'committed' && result.document.locationsById.get('child')).toEqual({
      kind: 'container-region',
      containerId: 'container',
      regionId: 'main',
      index: 0,
    })
  })

  it('owns a deep snapshot of inserted bundle data', () => {
    const document = resolveReady(makeEmptySchema())
    const bundle = {
      entryId: 'new',
      nodes: [{ id: 'new', type: 'text', props: { content: { label: 'Original' } } }],
      containers: {},
    }

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle,
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, textDefinitions)
    bundle.nodes[0].props.content.label = 'Mutated'

    expect(result.status === 'committed' && result.document.schema.nodes[0].props).toEqual({
      content: { label: 'Original' },
    })
  })

  it('rejects an insertion that exceeds region cardinality without changing the input', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'limited', props: {} },
      { id: 'existing', type: 'text', props: {} },
    ]
    schema.structure.root = ['container']
    schema.structure.containers = { container: { regions: { main: ['existing'] } } }
    const resolution = resolveSchema(schema, constrainedDefinitions)
    if (resolution.status !== 'ready')
      throw new Error(`Expected ready document, received ${resolution.status}`)

    const result = applySchemaOperation(resolution.document, {
      type: 'insert-bundle',
      bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
      to: {
        owner: { kind: 'container-region', containerId: 'container', regionId: 'main' },
        position: { kind: 'end' },
      },
    }, constrainedDefinitions)

    expect(result.status === 'rejected' && result.diagnostics?.[0]?.code).toBe('REGION_CARDINALITY_MAX')
    expect(resolution.document.schema.structure.containers.container.regions.main).toEqual(['existing'])
  })

  it('rejects a node type that its destination region does not accept', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'container', type: 'limited', props: {} }]
    schema.structure.root = ['container']
    schema.structure.containers = { container: { regions: { main: [] } } }
    const resolution = resolveSchema(schema, constrainedDefinitions)
    if (resolution.status !== 'ready')
      throw new Error(`Expected ready document, received ${resolution.status}`)

    const result = applySchemaOperation(resolution.document, {
      type: 'insert-bundle',
      bundle: { entryId: 'image', nodes: [{ id: 'image', type: 'image', props: {} }], containers: {} },
      to: {
        owner: { kind: 'container-region', containerId: 'container', regionId: 'main' },
        position: { kind: 'end' },
      },
    }, constrainedDefinitions)

    expect(result.status === 'rejected' && result.diagnostics?.[0]?.code).toBe('REGION_TYPE_NOT_ACCEPTED')
  })

  it('rejects a bundle whose node identity already exists in the document', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'existing', type: 'text', props: {} }]
    schema.structure.root = ['existing']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'existing', nodes: [{ id: 'existing', type: 'text', props: {} }], containers: {} },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, textDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: 'existing', reason: 'node-id-conflict' },
    })
  })

  it('rejects a bundle whose entry is not one of its nodes', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: { entryId: 'missing-entry', nodes: [{ id: 'other', type: 'text', props: {} }], containers: {} },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, textDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { reason: 'entry-not-in-bundle', entryId: 'missing-entry' },
    })
  })

  it('rejects a bundle that tries to reuse a document container owner', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'stack', props: {} },
      { id: 'child', type: 'text', props: {} },
    ]
    schema.structure.root = ['container']
    schema.structure.containers = { container: { regions: { main: ['child'] } } }
    const resolution = resolveSchema(schema, containerDefinitions)
    if (resolution.status !== 'ready')
      throw new Error(`Expected ready document, received ${resolution.status}`)

    const result = applySchemaOperation(resolution.document, {
      type: 'insert-bundle',
      bundle: {
        entryId: 'new',
        nodes: [{ id: 'new', type: 'text', props: {} }],
        containers: { container: { regions: { main: ['child'] } } },
      },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, containerDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: 'container', reason: 'container-not-in-bundle' },
    })
  })

  it('rejects a bundle that references a region child outside the aggregate', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'existing', type: 'text', props: {} }]
    schema.structure.root = ['existing']
    const resolution = resolveSchema(schema, textDefinitions)
    if (resolution.status !== 'ready')
      throw new Error(`Expected ready document, received ${resolution.status}`)

    const result = applySchemaOperation(resolution.document, {
      type: 'insert-bundle',
      bundle: {
        entryId: 'container',
        nodes: [{ id: 'container', type: 'stack', props: {} }],
        containers: { container: { regions: { main: ['existing'] } } },
      },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, containerDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: 'existing', reason: 'child-not-in-bundle' },
    })
  })

  it('rejects a detached non-entry node inside a bundle', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: {
        entryId: 'entry',
        nodes: [
          { id: 'entry', type: 'text', props: {} },
          { id: 'detached', type: 'text', props: {} },
        ],
        containers: {},
      },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, textDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: 'detached', reason: 'node-unowned' },
    })
  })

  it('rejects multiple internal owners for one bundle child', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: {
        entryId: 'container',
        nodes: [
          { id: 'container', type: 'columns', props: {} },
          { id: 'child', type: 'text', props: {} },
        ],
        containers: {
          container: { regions: { primary: ['child'], secondary: ['child'] } },
        },
      },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, multiRegionDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: 'child', reason: 'node-multiple-owners' },
    })
  })

  it('rejects a bundle whose entry is also an internal region child', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'insert-bundle',
      bundle: {
        entryId: 'container',
        nodes: [{ id: 'container', type: 'columns', props: {} }],
        containers: {
          container: { regions: { primary: ['container'], secondary: [] } },
        },
      },
      to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
    }, multiRegionDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'BUNDLE_INVALID',
      details: { nodeId: 'container', reason: 'entry-has-internal-owner' },
    })
  })

  it('moves a root node after an anchor without caller-managed index offsets', () => {
    const schema = makeEmptySchema()
    schema.nodes = ['a', 'b', 'c'].map(id => ({ id, type: 'text', props: {} }))
    schema.structure.root = ['a', 'b', 'c']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'move',
      nodeId: 'a',
      to: { owner: { kind: 'page-root' }, position: { kind: 'after', nodeId: 'b' } },
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure.root).toEqual(['b', 'a', 'c'])
  })

  it('moves an ordinary node from the page root into a container region', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'stack', props: {} },
      { id: 'loose', type: 'text', props: {} },
    ]
    schema.structure.root = ['container', 'loose']
    schema.structure.containers = { container: { regions: { main: [] } } }
    const document = (() => {
      const result = resolveSchema(schema, containerDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'move',
      nodeId: 'loose',
      to: {
        owner: { kind: 'container-region', containerId: 'container', regionId: 'main' },
        position: { kind: 'end' },
      },
    }, containerDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure).toEqual({
      root: ['container'],
      containers: { container: { regions: { main: ['loose'] } } },
    })
  })

  it('moves a region child back to the page root', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'stack', props: {} },
      { id: 'child', type: 'text', props: {} },
    ]
    schema.structure.root = ['container']
    schema.structure.containers = { container: { regions: { main: ['child'] } } }
    const document = (() => {
      const result = resolveSchema(schema, containerDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'move',
      nodeId: 'child',
      to: { owner: { kind: 'page-root' }, position: { kind: 'after', nodeId: 'container' } },
    }, containerDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure).toEqual({
      root: ['container', 'child'],
      containers: { container: { regions: { main: [] } } },
    })
  })

  it('rejects a self anchor when moving to a different owner', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'columns', props: {} },
      { id: 'child', type: 'text', props: {} },
    ]
    schema.structure.root = ['container']
    schema.structure.containers = {
      container: { regions: { primary: ['child'], secondary: [] } },
    }
    const resolution = resolveSchema(schema, multiRegionDefinitions)
    if (resolution.status !== 'ready')
      throw new Error(`Expected ready document, received ${resolution.status}`)

    const result = applySchemaOperation(resolution.document, {
      type: 'move',
      nodeId: 'child',
      to: {
        owner: { kind: 'container-region', containerId: 'container', regionId: 'secondary' },
        position: { kind: 'before', nodeId: 'child' },
      },
    }, multiRegionDefinitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'DESTINATION_ANCHOR_NOT_FOUND',
      details: { nodeId: 'child' },
    })
  })

  it('removes an ordinary root node and its ownership reference', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'keep', type: 'text', props: {} },
      { id: 'remove', type: 'text', props: {} },
    ]
    schema.structure.root = ['keep', 'remove']
    const document = (() => {
      const result = resolveSchema(schema, textDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'remove',
      nodeId: 'remove',
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema).toEqual({
      ...makeEmptySchema(),
      nodes: [{ id: 'keep', type: 'text', props: {} }],
      structure: { root: ['keep'], containers: {} },
    })
  })

  it('removes an ordinary child from its container region', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'stack', props: {} },
      { id: 'remove', type: 'text', props: {} },
    ]
    schema.structure.root = ['container']
    schema.structure.containers = { container: { regions: { main: ['remove'] } } }
    const document = (() => {
      const result = resolveSchema(schema, containerDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'remove',
      nodeId: 'remove',
    }, containerDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure.containers).toEqual({
      container: { regions: { main: [] } },
    })
    expect(result.status === 'committed' && result.document.schema.nodes).toEqual([
      { id: 'container', type: 'stack', props: {} },
    ])
  })

  it('cascade-removes a container owner and every region child', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'container', type: 'stack', props: {} },
      { id: 'first', type: 'text', props: {} },
      { id: 'second', type: 'text', props: {} },
    ]
    schema.structure.root = ['container']
    schema.structure.containers = { container: { regions: { main: ['first', 'second'] } } }
    const document = (() => {
      const result = resolveSchema(schema, containerDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'remove',
      nodeId: 'container',
    }, containerDefinitions)

    expect(result.status === 'committed' && result.document.schema).toEqual(makeEmptySchema())
  })

  it('unwraps region children into the root in declaration order', () => {
    const schema = makeEmptySchema()
    schema.nodes = [
      { id: 'before', type: 'text', props: {} },
      { id: 'container', type: 'columns', props: {} },
      { id: 'primary-a', type: 'text', props: {} },
      { id: 'primary-b', type: 'text', props: {} },
      { id: 'secondary', type: 'text', props: {} },
      { id: 'after', type: 'text', props: {} },
    ]
    schema.structure.root = ['before', 'container', 'after']
    schema.structure.containers = {
      container: {
        regions: {
          secondary: ['secondary'],
          primary: ['primary-a', 'primary-b'],
        },
      },
    }
    const document = (() => {
      const result = resolveSchema(schema, multiRegionDefinitions)
      if (result.status !== 'ready')
        throw new Error(`Expected ready document, received ${result.status}`)
      return result.document
    })()

    const result = applySchemaOperation(document, {
      type: 'unwrap',
      containerId: 'container',
    }, multiRegionDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure).toEqual({
      root: ['before', 'primary-a', 'primary-b', 'secondary', 'after'],
      containers: {},
    })
    expect(result.status === 'committed' && result.document.nodesById.has('container')).toBe(false)
  })

  it('applies a batch sequentially and commits its final document once', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'batch',
      operations: [
        { type: 'update-global-config', globalConfig: { locale: 'zh-CN' } },
        { type: 'update-page', page: { props: { title: 'Batch' } } },
      ],
    }, definitions)

    expect(result.status === 'committed' && result.document.schema).toEqual({
      ...makeEmptySchema(),
      globalConfig: { locale: 'zh-CN' },
      page: { props: { title: 'Batch' } },
    })
  })

  it('lets a later batch operation address a node inserted earlier in the batch', () => {
    const schema = makeEmptySchema()
    schema.nodes = [{ id: 'existing', type: 'text', props: {} }]
    schema.structure.root = ['existing']
    const resolution = resolveSchema(schema, textDefinitions)
    if (resolution.status !== 'ready')
      throw new Error(`Expected ready document, received ${resolution.status}`)

    const result = applySchemaOperation(resolution.document, {
      type: 'batch',
      operations: [
        {
          type: 'insert-bundle',
          bundle: { entryId: 'new', nodes: [{ id: 'new', type: 'text', props: {} }], containers: {} },
          to: { owner: { kind: 'page-root' }, position: { kind: 'end' } },
        },
        {
          type: 'move',
          nodeId: 'new',
          to: { owner: { kind: 'page-root' }, position: { kind: 'before', nodeId: 'existing' } },
        },
      ],
    }, textDefinitions)

    expect(result.status === 'committed' && result.document.schema.structure.root).toEqual(['new', 'existing'])
  })

  it('rejects a nested batch at runtime', () => {
    const document = resolveReady(makeEmptySchema())
    const nestedRequest = {
      type: 'batch',
      operations: [{
        type: 'batch',
        operations: [{ type: 'update-global-config', globalConfig: { locale: 'nested' } }],
      }],
    } as unknown as OperationBatch

    const result = applySchemaOperation(document, nestedRequest, definitions)

    expect(result).toEqual({ status: 'rejected', code: 'BATCH_NESTED' })
  })

  it('discards all earlier batch changes when a later operation is rejected', () => {
    const document = resolveReady(makeEmptySchema())

    const result = applySchemaOperation(document, {
      type: 'batch',
      operations: [
        { type: 'update-global-config', globalConfig: { locale: 'discarded' } },
        { type: 'update-node', nodeId: 'missing', node: { type: 'text', props: {} } },
      ],
    }, definitions)

    expect(result).toEqual({
      status: 'rejected',
      code: 'NODE_NOT_FOUND',
      details: { nodeId: 'missing' },
    })
    expect(document.schema).toEqual(makeEmptySchema())
  })

  it('keeps generated legal one-level documents valid through bounded operation sequences', () => {
    fc.assert(fc.property(
      fc.record({
        rootCount: fc.integer({ min: 0, max: 5 }),
        childCount: fc.integer({ min: 0, max: 5 }),
        moves: fc.array(fc.integer({ min: 0, max: 7 }), { maxLength: 8 }),
        locales: fc.array(fc.string({ maxLength: 8 }), { maxLength: 5 }),
      }),
      ({ rootCount, childCount, moves, locales }) => {
        const rootIds = Array.from({ length: rootCount }, (_, index) => `root-${index}`)
        const childIds = Array.from({ length: childCount }, (_, index) => `child-${index}`)
        const schema = makeEmptySchema()
        schema.nodes = [
          { id: 'container', type: 'stack', props: {} },
          ...rootIds.map(id => ({ id, type: 'text', props: {} })),
          ...childIds.map(id => ({ id, type: 'text', props: {} })),
        ]
        schema.structure.root = ['container', ...rootIds]
        schema.structure.containers = { container: { regions: { main: childIds } } }
        const resolution = resolveSchema(schema, containerDefinitions)
        expect(resolution.status).toBe('ready')
        if (resolution.status !== 'ready')
          return

        const operations = [
          ...(rootIds.length === 0
            ? []
            : moves.map(value => ({
                type: 'move' as const,
                nodeId: rootIds[value % rootIds.length],
                to: { owner: { kind: 'page-root' as const }, position: { kind: 'end' as const } },
              }))),
          ...locales.map(locale => ({ type: 'update-global-config' as const, globalConfig: { locale } })),
        ]
        const before = JSON.stringify(resolution.document.schema)
        const result = applySchemaOperation(resolution.document, { type: 'batch', operations }, containerDefinitions)
        expect(['committed', 'unchanged']).toContain(result.status)
        expect(JSON.stringify(resolution.document.schema)).toBe(before)
        if (result.status === 'committed') {
          const after = resolveSchema(result.document.schema, containerDefinitions)
          expect(after.status).toBe('ready')
        }
      },
    ), { numRuns: 50, seed: 20260806, verbose: true })
  })
})
