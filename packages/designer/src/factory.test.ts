import type { DocumentSchema } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createDesigner } from './factory'

const Preview = defineComponent({ name: 'FactoryPreview', setup: () => () => null })

describe('createDesigner public factory', () => {
  it('creates the canonical empty document when schema is omitted', () => {
    const designer = createDesigner({ materials: [] })
    expect(designer.exportSchema()).toEqual({
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [],
      structure: { root: [], containers: {} },
    })
    designer.dispose()
  })

  it('registers MaterialDefinition entries before resolving the supplied Schema', () => {
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'layout', type: 'layout', props: {} }],
      structure: { root: ['layout'], containers: { layout: { regions: { content: [] } } } },
    }
    const designer = createDesigner({
      materials: [{
        type: 'layout',
        schema: {
          container: { regions: [{ id: 'content' }] },
        },
        presentation: { kind: 'visual', preview: Preview },
      }],
      schema,
    })

    expect(designer.document.value.status).toBe('ready')
    expect(designer.exportSchema()).toEqual(schema)
    designer.dispose()
  })

  it('rejects the legacy public option shape', () => {
    expect(() => createDesigner({} as never)).toThrowError('MATERIALS_INVALID: materials')
  })
})
