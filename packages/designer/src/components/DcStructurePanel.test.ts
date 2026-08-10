// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { ContainerRegionOutlet, createDesigner } from '../index'
import DcDesigner from './DcDesigner'

describe('dcStructurePanel', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders root and region ownership in Schema order', async () => {
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'container', type: 'container', props: {} },
        { id: 'child', type: 'text', props: {} },
        { id: 'tail', type: 'text', props: {} },
      ],
      structure: { root: ['container', 'tail'], containers: { container: { regions: { content: ['child'] } } } },
    }
    const designer = createDesigner({
      schema,
      materials: [
        {
          type: 'container',
          schema: { container: { regions: [{ id: 'content' }] } },
          presentation: { kind: 'visual', preview: defineComponent({ setup: () => () => h(ContainerRegionOutlet, { regionId: 'content' }) }) },
        },
        { type: 'text', presentation: { kind: 'visual', preview: defineComponent({}) } },
      ],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      Array.from(host.querySelectorAll<HTMLButtonElement>('.dc-left-sidebar__tab'))
        .find(button => button.title === '结构树')
        ?.click()
      await nextTick()
      expect(Array.from(host.querySelectorAll<HTMLElement>('[data-dc-component="structure-item"]'))
        .map(item => item.dataset.nodeId)).toEqual(['container', 'child', 'tail'])
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
