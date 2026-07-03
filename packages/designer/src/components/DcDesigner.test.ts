// @vitest-environment happy-dom
import type { DesignerSchema, WidgetMeta } from '..'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createDesigner } from '..'
import DcDesigner from './DcDesigner'

function makeMeta(): WidgetMeta {
  return {
    type: 'button',
    title: 'Button',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
  } as WidgetMeta
}

function makeSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [],
    },
  }
}

describe('dcDesigner', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a dedicated portal root for floating designer interaction layers', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(DcDesigner, { instance: designer }),
    })

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector('[data-dc-designer-portal]')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
