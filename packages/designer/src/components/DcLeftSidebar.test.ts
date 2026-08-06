// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createDesigner } from '../session/create-designer'
import DcDesigner from './DcDesigner'

describe('dcLeftSidebar', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('switches from the Material Catalog view to the Schema structure view', async () => {
    const designer = createDesigner({
      materials: [{
        type: 'text',
        panel: { title: 'Text' },
        presentation: { kind: 'visual', preview: defineComponent({}) },
      }],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      expect(host.querySelector('[data-dc-component="material-panel"]')).not.toBeNull()
      const structure = Array.from(host.querySelectorAll<HTMLButtonElement>('.dc-left-sidebar__tab'))
        .find(button => button.title === '结构树')!
      structure.click()
      await nextTick()
      expect(host.querySelector('[data-dc-component="structure-panel"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-component="material-panel"]')).toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
