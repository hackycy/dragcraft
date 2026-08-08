import type { DesignerSchema } from '@dragcraft/legacy-core'
import { describe, expect, it } from 'vitest'
import { createDesigner } from '../factory'
import { useDesigner } from './useDesigner'

function makeSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: { theme: 'light' },
    root: { id: 'root', type: 'root', props: {}, children: [] },
  }
}

describe('useDesigner', () => {
  it('exports an isolated copy of the session document', () => {
    const designer = createDesigner({ engineOptions: { initialSchema: makeSchema() } })
    const { exportSchema, schema } = useDesigner(designer)
    const exported = exportSchema()

    exported.globalConfig.theme = 'dark'

    expect(exported).not.toBe(schema.value)
    expect(schema.value.globalConfig).toEqual({ theme: 'light' })

    designer.dispose()
  })
})
