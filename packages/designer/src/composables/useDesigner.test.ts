import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createDesigner } from '../factory'
import { useDesigner } from './useDesigner'

function makeSchema() {
  return {
    version: '1',
    globalConfig: { theme: 'light' },
    page: { props: {} },
    nodes: [],
    structure: { root: [], containers: {} },
  }
}

describe('useDesigner', () => {
  it('exports an isolated copy of the session document', () => {
    const designer = createDesigner({
      schema: makeSchema(),
      materials: [{
        type: 'text',
        presentation: { kind: 'visual', preview: defineComponent({ setup: () => () => null }) },
      }],
    })
    const { exportSchema, schema } = useDesigner(designer)
    const exported = exportSchema()

    exported!.globalConfig.theme = 'dark'

    expect(exported).not.toBe(schema.value)
    expect(schema.value?.globalConfig).toEqual({ theme: 'light' })

    designer.dispose()
  })
})
