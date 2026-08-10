// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createDesigner } from '../factory'
import { getDesignerSession } from '../session/get-designer-session'
import { useDragDrop } from './useDragDrop'

function event(): DragEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    clientY: 0,
    target: document.createElement('div'),
    currentTarget: document.createElement('div'),
    relatedTarget: null,
    dataTransfer: { effectAllowed: '', dropEffect: '', setData: vi.fn(), setDragImage: vi.fn() },
  } as unknown as DragEvent
}

describe('useDragDrop', () => {
  it('keeps drag state in DesignerSession and commits a material drop once', () => {
    const schema: DocumentSchema = { version: '1', globalConfig: {}, page: { props: {} }, nodes: [], structure: { root: [], containers: {} } }
    const designer = createDesigner({
      schema,
      materials: [{ type: 'text', schema: { defaultProps: { content: '' } }, presentation: { kind: 'visual', preview: defineComponent({}) } }],
    })
    try {
      const session = getDesignerSession(designer)
      const dragDrop = useDragDrop(session)
      const meta = session.materials.get('text')!
      const start = event()
      dragDrop.handleMaterialDragStart(start, meta)
      expect(session.state.dragTarget.value).toEqual({ sourceNodeId: null, widgetType: 'text' })
      dragDrop.dragOverDestination.value = { kind: 'root', sortScope: 'content', index: 0 }
      expect(dragDrop.commitDrop()).toEqual({ ok: true, changed: true })
      expect(designer.exportSchema()?.structure.root).toHaveLength(1)
      expect(session.state.dragTarget.value).toBeNull()
    }
    finally {
      designer.dispose()
    }
  })
})
