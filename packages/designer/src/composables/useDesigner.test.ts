import { describe, expect, it } from 'vitest'
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
  it('curries undo and redo through the instance history', () => {
    const designer = createDesigner({ schema: makeSchema(), materials: [] })
    const { execute, undo, redo, canUndo, canRedo } = useDesigner(designer)

    expect(canUndo()).toBe(false)
    expect(canRedo()).toBe(false)

    execute({ type: 'update-global-config', globalConfig: { theme: 'dark' } })
    expect(canUndo()).toBe(true)
    expect(designer.exportSchema()?.globalConfig).toEqual({ theme: 'dark' })

    undo()
    expect(canUndo()).toBe(false)
    expect(canRedo()).toBe(true)
    expect(designer.exportSchema()?.globalConfig).toEqual({ theme: 'light' })

    redo()
    expect(canRedo()).toBe(false)
    expect(designer.exportSchema()?.globalConfig).toEqual({ theme: 'dark' })

    designer.dispose()
  })
})
