import type { NodeBundle } from '@dragcraft/core'
import type { MaterialBundleFactoryContext, MaterialDefinition } from './types'
import { describe, expect, it, vi } from 'vitest'
import { createMaterialCatalog, DesignerConfigurationError } from './create-material-catalog'
import { defineMaterial } from './define-material'

describe('createMaterialCatalog', () => {
  it('rejects duplicate material types at initialization', () => {
    const material = {
      type: 'text',
      presentation: { kind: 'headless' as const },
    }

    expect(() => createMaterialCatalog([material, material])).toThrowError(
      new DesignerConfigurationError('MATERIAL_TYPE_DUPLICATE', 'text'),
    )
  })

  it('returns the same material from the inference helper', () => {
    const material = {
      type: 'analytics',
      presentation: { kind: 'headless' as const },
    }

    expect(defineMaterial(material)).toBe(material)
  })

  it('rejects a visual material without a preview at initialization', () => {
    const material = {
      type: 'banner',
      presentation: { kind: 'visual' },
    } as unknown as MaterialDefinition

    expect(() => createMaterialCatalog([material])).toThrowError(
      new DesignerConfigurationError('MATERIAL_VISUAL_PREVIEW_MISSING', 'banner'),
    )
  })

  it('requires an explicit and internally consistent presentation kind', () => {
    const cases = [
      {
        material: { type: 'missing-presentation' },
        code: 'MATERIAL_PRESENTATION_INVALID' as const,
      },
      {
        material: {
          type: 'headless-with-preview',
          presentation: { kind: 'headless', preview: {} },
        },
        code: 'MATERIAL_HEADLESS_PREVIEW_FORBIDDEN' as const,
      },
    ]

    for (const { material, code } of cases) {
      expect(() => createMaterialCatalog([material as unknown as MaterialDefinition])).toThrowError(
        new DesignerConfigurationError(code, material.type),
      )
    }
  })

  it('rejects invalid container declarations at initialization', () => {
    const invalidContainers = [
      { regions: [] },
      { regions: [{ id: 'content' }, { id: 'content' }] },
      { regions: [{ id: 'content', cardinality: { min: 2, max: 1 } }] },
    ]

    for (const [index, container] of invalidContainers.entries()) {
      const type = `container-${index}`
      const material = {
        type,
        schema: { container },
        presentation: { kind: 'headless' },
      } as unknown as MaterialDefinition

      expect(() => createMaterialCatalog([material])).toThrowError(
        new DesignerConfigurationError('MATERIAL_CONTAINER_INVALID', type),
      )
    }
  })

  it('owns immutable Core, Authoring, and Presentation projections', () => {
    const regions = [{ id: 'content', accepts: { types: ['text'] } }]
    const authoring = {}
    const presentation = { kind: 'headless' as const }
    const material = {
      type: 'stack',
      schema: { container: { regions } },
      authoring,
      presentation,
    }

    const catalog = createMaterialCatalog([material])
    regions[0]!.id = 'changed'
    regions[0]!.accepts!.types.push('image')

    expect(catalog.schemaDefinitions.revision).toBe(1)
    expect(catalog.schemaDefinitions.types.get('stack')).toEqual({
      container: {
        regions: [{ id: 'content', accepts: { types: ['text'] } }],
      },
    })
    expect(catalog.getAuthoring('stack')).toEqual(authoring)
    expect(catalog.getPresentation('stack')).toEqual(presentation)
    expect(catalog.getPresentation('missing')).toBeUndefined()
    expect(Object.isFrozen(catalog.schemaDefinitions.types.get('stack')!.container!.regions)).toBe(true)
    expect(Object.isFrozen(catalog.getAuthoring('stack'))).toBe(true)
    expect(Object.isFrozen(catalog.getPresentation('stack'))).toBe(true)
  })

  it('creates isolated standard bundles for ordinary visual and headless materials', () => {
    const defaultProps = { label: 'Initial' }
    const defaultStyle = { color: 'red' }
    const catalog = createMaterialCatalog([
      {
        type: 'text',
        schema: { defaultProps, defaultStyle },
        presentation: { kind: 'visual', preview: {} },
      },
      {
        type: 'analytics',
        presentation: { kind: 'headless' },
      },
    ])
    let nextId = 0
    const createNodeId = (): string => `node-${++nextId}`

    defaultProps.label = 'Changed'
    defaultStyle.color = 'blue'

    expect(catalog.createBundle('text', createNodeId)).toEqual({
      entryId: 'node-1',
      nodes: [{
        id: 'node-1',
        type: 'text',
        props: { label: 'Initial' },
        style: { color: 'red' },
      }],
      containers: {},
    })
    expect(catalog.createBundle('analytics', createNodeId)).toEqual({
      entryId: 'node-2',
      nodes: [{ id: 'node-2', type: 'analytics', props: {} }],
      containers: {},
    })
  })

  it('creates a complete standard bundle for a container material', () => {
    const catalog = createMaterialCatalog([{
      type: 'columns',
      schema: {
        defaultProps: { gap: 16 },
        container: {
          regions: [{ id: 'main' }, { id: 'aside' }],
        },
      },
      presentation: { kind: 'headless' },
    }])

    expect(catalog.createBundle('columns', () => 'columns-1')).toEqual({
      entryId: 'columns-1',
      nodes: [{ id: 'columns-1', type: 'columns', props: { gap: 16 } }],
      containers: {
        'columns-1': { regions: { main: [], aside: [] } },
      },
    })
  })

  it('delegates aggregate creation to optional material authoring customization', () => {
    const createBundle = vi.fn(({
      createNodeId,
      type,
    }: MaterialBundleFactoryContext): NodeBundle => {
      const containerId = createNodeId()
      const childId = createNodeId()
      return {
        entryId: containerId,
        nodes: [
          { id: containerId, type, props: {} },
          { id: childId, type: 'text', props: { value: 'Initial' } },
        ],
        containers: {
          [containerId]: { regions: { content: [childId] } },
        },
      }
    })
    const catalog = createMaterialCatalog([{
      type: 'card',
      schema: { container: { regions: [{ id: 'content' }] } },
      authoring: { createBundle },
      presentation: { kind: 'headless' },
    }])
    let nextId = 0

    expect(catalog.createBundle('card', () => `generated-${++nextId}`)).toEqual({
      entryId: 'generated-1',
      nodes: [
        { id: 'generated-1', type: 'card', props: {} },
        { id: 'generated-2', type: 'text', props: { value: 'Initial' } },
      ],
      containers: {
        'generated-1': { regions: { content: ['generated-2'] } },
      },
    })
    expect(createBundle).toHaveBeenCalledOnce()
  })

  it('rejects malformed material schema configuration before projection', () => {
    const cases = [
      {
        material: { type: '', presentation: { kind: 'headless' } },
        code: 'MATERIAL_TYPE_INVALID' as const,
      },
      {
        material: {
          type: 'blank-region',
          schema: { container: { regions: [{ id: '' }] } },
          presentation: { kind: 'headless' },
        },
        code: 'MATERIAL_CONTAINER_INVALID' as const,
      },
      {
        material: {
          type: 'invalid-accepts',
          schema: { container: { regions: [{ id: 'content', accepts: { types: [''] } }] } },
          presentation: { kind: 'headless' },
        },
        code: 'MATERIAL_CONTAINER_INVALID' as const,
      },
      {
        material: {
          type: 'invalid-cardinality',
          schema: { container: { regions: [{ id: 'content', cardinality: { min: -1 } }] } },
          presentation: { kind: 'headless' },
        },
        code: 'MATERIAL_CONTAINER_INVALID' as const,
      },
      {
        material: {
          type: 'invalid-regions-shape',
          schema: { container: { regions: null } },
          presentation: { kind: 'headless' },
        },
        code: 'MATERIAL_CONTAINER_INVALID' as const,
      },
      {
        material: {
          type: 'executable-default',
          schema: { defaultProps: { callback: () => undefined } },
          presentation: { kind: 'headless' },
        },
        code: 'MATERIAL_SCHEMA_INVALID' as const,
      },
      {
        material: {
          type: 'array-default-props',
          schema: { defaultProps: [] },
          presentation: { kind: 'headless' },
        },
        code: 'MATERIAL_SCHEMA_INVALID' as const,
      },
      {
        material: {
          type: 'invalid-authoring-policy',
          authoring: { policy: { remove: 'sometimes' } },
          presentation: { kind: 'headless' },
        },
        code: 'MATERIAL_AUTHORING_INVALID' as const,
      },
    ]

    for (const { material, code } of cases) {
      expect(() => createMaterialCatalog([material as unknown as MaterialDefinition])).toThrowError(
        new DesignerConfigurationError(code, material.type),
      )
    }
  })

  it('isolates the nested Authoring Policy from later input mutation', () => {
    const policy = { remove: 'denied' as const }
    const catalog = createMaterialCatalog([{
      type: 'locked',
      authoring: { policy },
      presentation: { kind: 'headless' },
    }])

    policy.remove = 'allowed' as 'denied'

    expect(catalog.getAuthoring('locked')?.policy?.remove).toBe('denied')
    expect(Object.isFrozen(catalog.getAuthoring('locked')?.policy)).toBe(true)
  })

  it('keeps optional panel and inspector declarations on the single material lookup', () => {
    const tags = ['copy']
    const sections: Array<{ title: string, fields: never[] }> = []
    const material = {
      type: 'text',
      panel: { title: 'Text', group: 'basic', tags },
      inspector: { formSchema: { sections } },
      presentation: { kind: 'headless' as const },
    }
    const catalog = createMaterialCatalog([material])
    tags.push('changed')
    sections.push({ title: 'Changed', fields: [] })

    expect(catalog.getMaterial('text')).toMatchObject({
      type: 'text',
      panel: { title: 'Text', group: 'basic', tags: ['copy'] },
      inspector: { formSchema: { sections: [] } },
      presentation: { kind: 'headless' },
    })
    expect(catalog.getMaterial('missing')).toBeUndefined()
  })
})
