// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner } from '../factory'
import DcDesigner from './DcDesigner'

const Preview = defineComponent({ name: 'DesignerPreview', setup: () => () => h('div', 'preview') })

function createTextDesigner(schema: DocumentSchema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [],
  structure: { root: [], containers: {} },
}) {
  return createDesigner({
    schema,
    materials: [{
      type: 'text',
      panel: { title: 'Text' },
      schema: { defaultProps: { content: '' } },
      presentation: { kind: 'visual', preview: Preview },
    }],
  })
}

describe('dcDesigner', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the canvas interaction surface and scoped history controls', async () => {
    const designer = createTextDesigner()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      expect(host.querySelector('[data-dc-canvas-interaction-layer]')).not.toBeNull()
      expect(host.querySelector('[data-dc-canvas-stage]')).not.toBeNull()
      expect(host.querySelector('[data-dc-workspace-control="undo"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="material-panel"] [data-dc-part="search-input"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('keeps history changes scoped to the Designer instance', async () => {
    const designer = createTextDesigner()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      designer.execute({ type: 'create-node', materialType: 'text', to: { owner: { kind: 'page-root' }, position: { kind: 'end' } } })
      app.mount(host)
      await nextTick()
      expect(designer.exportSchema()?.structure.root).toHaveLength(1)
      host.querySelector<HTMLButtonElement>('[data-dc-workspace-control="undo"]')?.click()
      await nextTick()
      expect(designer.exportSchema()?.structure.root).toEqual([])
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
