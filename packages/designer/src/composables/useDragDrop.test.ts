// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner, DcDesigner, DesignerRegionOutlet } from '../index'

function dragEvent(type: string): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent
  Object.defineProperty(event, 'dataTransfer', {
    value: { effectAllowed: '', dropEffect: '', setData: () => {}, setDragImage: () => {} },
  })
  return event
}

describe('workbench structural drag/drop', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('moves a root node into a Designer Region Outlet without numeric indexes', async () => {
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
          { id: 'text', type: 'text', props: {} },
        ],
        structure: {
          root: ['container', 'text'],
          containers: { container: { regions: { content: [] } } },
        },
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      host.querySelector<HTMLElement>('[data-dc-node-id="text"]')!.dispatchEvent(dragEvent('dragstart'))
      const region = host.querySelector<HTMLElement>('[data-dc-region-outlet="content"]')!
      region.dispatchEvent(dragEvent('dragover'))
      region.dispatchEvent(dragEvent('drop'))
      await nextTick()
      expect(designer.exportSchema()?.structure).toEqual({
        root: ['container'],
        containers: { container: { regions: { content: ['text'] } } },
      })
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
