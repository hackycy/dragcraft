// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner } from '../factory'
import DcDesigner from './DcDesigner'

const Preview = defineComponent({ name: 'MaterialPanelPreview', setup: () => () => h('div') })

const emptySchema: DocumentSchema = {
  version: '1',
  globalConfig: {},
  page: { props: {} },
  nodes: [],
  structure: { root: [], containers: {} },
}

describe('dcMaterialPanel', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('filters hidden materials while keeping visible materials listed', async () => {
    const designer = createDesigner({
      schema: emptySchema,
      materials: [
        {
          type: 'framework-navbar',
          panel: { title: '导航栏', visible: false },
          presentation: { kind: 'visual', preview: Preview },
        },
        {
          type: 'notice',
          panel: { title: '公告' },
          presentation: { kind: 'visual', preview: Preview },
        },
      ],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      const items = Array.from(host.querySelectorAll<HTMLElement>('[data-dc-component="material-item"]'))
      expect(items).toHaveLength(1)
      expect(items[0]?.textContent).toContain('公告')
      expect(items[0]?.textContent).not.toContain('导航栏')
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('reacts to schema changes for function visibility', async () => {
    const designer = createDesigner({
      schema: emptySchema,
      materials: [{
        type: 'optional',
        panel: {
          title: '可选物料',
          visible: ({ schema }) => schema?.nodes.some(node => node.type === 'notice') ?? false,
        },
        presentation: { kind: 'visual', preview: Preview },
      }],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })

    try {
      app.mount(host)
      await nextTick()
      expect(host.querySelectorAll('[data-dc-component="material-item"]')).toHaveLength(0)

      designer.importSchema({
        ...emptySchema,
        nodes: [{ id: 'notice-1', type: 'notice', props: {} }],
        structure: { root: ['notice-1'], containers: {} },
      })
      await nextTick()
      expect(host.querySelectorAll('[data-dc-component="material-item"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
