import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createDesigner } from './factory'

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
  })

  it('registers one MaterialDefinition collection before resolving Schema', () => {
    const designer = createDesigner({
      materials: [{
        type: 'text',
        presentation: { kind: 'visual', preview: defineComponent({}) },
      }],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'a', type: 'text', props: {} }],
        structure: { root: ['a'], containers: {} },
      },
    })
    expect(designer.document.value.status).toBe('ready')
  })
})
