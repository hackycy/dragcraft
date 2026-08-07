// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner, DesignerRegionOutlet } from '../index'
import DcDesigner from './DcDesigner'

describe('dcStructurePanel', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders root and region ownership in real Schema order', async () => {
    const designer = createDesigner({
      materials: [
        {
          type: 'container',
          schema: { container: { regions: [{ id: 'content' }] } },
          presentation: {
            kind: 'visual',
            preview: defineComponent({ setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }) }),
          },
        },
        { type: 'text', presentation: { kind: 'visual', preview: defineComponent({}) } },
      ],
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'container', type: 'container', props: {} },
          { id: 'child', type: 'text', props: {} },
          { id: 'tail', type: 'text', props: {} },
        ],
        structure: {
          root: ['container', 'tail'],
          containers: { container: { regions: { content: ['child'] } } },
        },
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      Array.from(host.querySelectorAll<HTMLButtonElement>('.dc-left-sidebar__tab'))
        .find(button => button.title === '结构树')!
        .click()
      await nextTick()
      expect(Array.from(host.querySelectorAll<HTMLElement>('[data-dc-component="structure-item"]'))
        .map(item => item.dataset.dcNodeId)).toEqual(['container', 'child', 'tail'])
      const firstItem = host.querySelector<HTMLElement>('[data-dc-component="structure-item"]')!
      expect(Array.from(firstItem.querySelectorAll<HTMLElement>('[data-dc-action]')).map(action => action.title))
        .toEqual(['上移', '下移', '复制', '删除'])
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
