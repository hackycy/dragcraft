// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { createDesigner } from '../factory'
import DcDesigner from './DcDesigner'

const Preview = defineComponent({ name: 'DesignerPreview', setup: () => () => h('div', 'preview') })
const FirstDeviceFrame = defineComponent({
  name: 'FirstDeviceFrame',
  setup(_, { slots }) {
    return () => h('main', { class: 'test-device-frame test-device-frame--first' }, slots.default?.())
  },
})
const SecondDeviceFrame = defineComponent({
  name: 'SecondDeviceFrame',
  setup(_, { slots }) {
    return () => h('main', { class: 'test-device-frame test-device-frame--second' }, slots.default?.())
  },
})

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

  it('uses the host device frame without rebuilding document history', async () => {
    const designer = createTextDesigner()
    const host = document.createElement('div')
    const deviceFrame = ref({ id: 'first', containerShell: FirstDeviceFrame })
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer, deviceFrame: deviceFrame.value }) })
    try {
      app.mount(host)
      await nextTick()
      designer.execute({ type: 'create-node', materialType: 'text', to: { owner: { kind: 'page-root' }, position: { kind: 'end' } } })
      const documentAfterWrite = designer.document.value

      expect(host.querySelector('.test-device-frame--first')).not.toBeNull()
      expect(designer.history.undoCount.value).toBe(1)

      deviceFrame.value = { id: 'second', containerShell: SecondDeviceFrame }
      await nextTick()

      expect(host.querySelector('.test-device-frame--second')).not.toBeNull()
      expect(designer.document.value).toBe(documentAfterWrite)
      expect(designer.history.undoCount.value).toBe(1)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
