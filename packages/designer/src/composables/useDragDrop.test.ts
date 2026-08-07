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
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const node = host.querySelector<HTMLElement>('[data-dc-node-id="text"]')!
      surface.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
      node.getBoundingClientRect = () => ({ left: 10, top: 20, right: 110, bottom: 60, width: 100, height: 40 }) as DOMRect
      node.click()
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      host.querySelector<HTMLElement>('[data-dc-action="drag"]')!.dispatchEvent(dragEvent('dragstart'))
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

  it('shows forbidden feedback before dropping a denied material', async () => {
    const designer = createDesigner({
      materials: [{
        type: 'blocked',
        authoring: { policy: { create: 'denied' } },
        panel: { title: 'Blocked' },
        presentation: { kind: 'headless' },
      }],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()

      host.querySelector<HTMLElement>('[data-dc-component="material-item"]')!
        .dispatchEvent(dragEvent('dragstart'))
      host.querySelector<HTMLElement>('[data-dc-plane="document"]')!
        .dispatchEvent(dragEvent('dragover'))
      await nextTick()

      const canvas = host.querySelector<HTMLElement>('[data-dc-component="canvas"]')!
      const overlay = host.querySelector<HTMLElement>(
        '[data-dc-plane="interaction"] [data-dc-component="forbidden-overlay"]',
      )!
      expect(canvas.dataset.dcState).toContain('forbidden')
      expect(overlay.dataset.dcRejectionCode).toBe('POLICY_DENIED')
      expect(overlay.querySelector('[data-dc-part="text"]')?.textContent)
        .toBe('当前物料不满足创建条件，无法添加到画布')
      expect(host.querySelector('[data-dc-component="drop-indicator"]')).toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
