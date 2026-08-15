import type { DocumentSchema } from '@dragcraft/core'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createDesigner } from '../factory'
import { getDesignerSession } from '../session/get-designer-session'
import { usePropertyBinding } from './usePropertyBinding'

const schema: DocumentSchema = {
  version: '1',
  globalConfig: { theme: 'light' },
  page: { props: {} },
  nodes: [{ id: 'text-1', type: 'text', props: { label: 'Hello' } }],
  structure: { root: ['text-1'], containers: {} },
}

function createFixture() {
  const designer = createDesigner({
    schema,
    materials: [{
      type: 'text',
      schema: {
        defaultProps: { label: '' },
      },
      inspector: {
        formSchema: {
          sections: [{ title: 'Basic', fields: [{ key: 'label', label: 'Label', component: 'Input' }] }],
        },
      },
      presentation: { kind: 'visual', preview: defineComponent({}) },
    }],
  })
  const session = getDesignerSession(designer)
  session.execute({ type: 'selection.set', nodeId: 'text-1' })
  return { designer, session }
}

describe('usePropertyBinding', () => {
  it('projects the selected node and material form from the active session', () => {
    const { designer, session } = createFixture()
    try {
      const binding = usePropertyBinding(session)
      expect(binding.selectedNode.value?.id).toBe('text-1')
      expect(binding.selectedMaterial.value?.type).toBe('text')
      expect(binding.selectedNodeProps.value).toMatchObject({ label: 'Hello' })
      expect(binding.selectedFormSchema.value?.sections).toHaveLength(1)
    }
    finally {
      designer.dispose()
    }
  })

  it('dispatches property changes through DesignerSession actions', () => {
    const { designer, session } = createFixture()
    try {
      const binding = usePropertyBinding(session)
      expect(binding.handlePropertyChange('label', 'World')).toEqual({ ok: true, changed: true })
      expect(designer.exportSchema()?.nodes[0]?.props).toEqual({ label: 'World' })
    }
    finally {
      designer.dispose()
    }
  })

  it('writes page surface style fields bound through the global configuration', () => {
    const { designer, session } = createFixture()
    try {
      const binding = usePropertyBinding(session, {
        globalConfigSchema: {
          sections: [{
            title: 'Page style',
            fields: [{
              key: 'backgroundColor',
              label: 'Background color',
              component: 'Color',
              bindTo: { scope: 'schema', path: 'page.style.surface.backgroundColor' },
            }],
          }],
        },
      })

      expect(binding.handleGlobalConfigChange('backgroundColor', '#123456')).toEqual({
        ok: true,
        changed: true,
      })
      expect(designer.exportSchema()?.page.style).toEqual({
        surface: { backgroundColor: '#123456' },
      })
    }
    finally {
      designer.dispose()
    }
  })
})
