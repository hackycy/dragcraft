// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner } from '../factory'
import DcDesigner from './DcDesigner'

describe('dcMaterialItem', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders MaterialDefinition metadata inside the draggable shell', async () => {
    const designer = createDesigner({
      materials: [{
        type: 'banner',
        panel: { title: 'Banner', description: 'Promotional content' },
        presentation: { kind: 'visual', preview: defineComponent({}) },
      }],
      extensions: {
        materialItemRenderer: ({ material }) => h('strong', { class: 'custom-material' }, material.title),
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      const item = host.querySelector<HTMLElement>('[data-dc-component="material-item"]')
      expect(item?.getAttribute('draggable')).toBe('true')
      expect(item?.title).toContain('Banner')
      expect(item?.querySelector('.custom-material')?.textContent).toBe('Banner')
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
