// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { createDesigner } from '../factory'
import ContainerRegionOutlet from '../presentation/container-region-outlet'
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
const PresentationFrame = defineComponent({
  name: 'TestPresentationFrame',
  setup(_, { slots }) {
    return () => h('div', { class: 'test-presentation-frame' }, slots.default?.())
  },
})
const MissingOutletContainer = defineComponent({
  name: 'MissingOutletContainer',
  setup: () => () => h('div', 'container without an outlet'),
})
const DuplicateOutletContainer = defineComponent({
  name: 'DuplicateOutletContainer',
  setup: () => () => [
    h(ContainerRegionOutlet, { regionId: 'main' }),
    h(ContainerRegionOutlet, { regionId: 'main' }),
  ],
})
const SingleOutletContainer = defineComponent({
  name: 'SingleOutletContainer',
  setup: () => () => h(ContainerRegionOutlet, { regionId: 'main' }),
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

  it('mounts every root node once in Schema order, including headless and unknown nodes', async () => {
    const designer = createDesigner({
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'unknown', type: 'unknown', props: {} },
          { id: 'headless', type: 'headless', props: {} },
          { id: 'visual', type: 'text', props: {} },
        ],
        structure: { root: ['unknown', 'headless', 'visual'], containers: {} },
      },
      materials: [
        { type: 'headless', presentation: { kind: 'headless' } },
        { type: 'text', presentation: { kind: 'visual', preview: Preview } },
      ],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, {
      instance: designer,
      deviceFrame: { id: 'test', containerShell: FirstDeviceFrame },
    }) })
    try {
      app.mount(host)
      await nextTick()
      const content = host.querySelector<HTMLElement>('.dc-canvas-surface__content')
      expect(content).not.toBeNull()
      expect(Array.from(content!.querySelectorAll<HTMLElement>(':scope > [data-dc-component="node"]'))
        .map(node => node.dataset.nodeId)).toEqual(['unknown', 'headless', 'visual'])
      for (const nodeId of ['unknown', 'headless', 'visual'])
        expect(host.querySelectorAll(`[data-dc-component="node"][data-node-id="${nodeId}"]`)).toHaveLength(1)
      expect(host.querySelectorAll('[data-dc-selection-plane="content"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-dc-selection-plane="root"]')).toHaveLength(1)
      expect(host.querySelector('[data-dc-selection-plane="root"]')?.closest('.test-device-frame')).toBeNull()
      expect(host.querySelector('[data-node-id="headless"] [data-dc-component="widget-fallback"]')).toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('renders a visual material through exactly one PresentationFrame slot', async () => {
    const designer = createDesigner({
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'framed', type: 'framed', props: {} }],
        structure: { root: ['framed'], containers: {} },
      },
      materials: [{
        type: 'framed',
        presentation: { kind: 'visual', preview: Preview, frame: PresentationFrame },
      }],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, { instance: designer }) })
    try {
      app.mount(host)
      await nextTick()
      expect(host.querySelectorAll('.test-presentation-frame')).toHaveLength(1)
      expect(host.querySelectorAll('.test-presentation-frame > [data-dc-component="node"][data-node-id="framed"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it.each([
    ['missing', MissingOutletContainer, 'CONTAINER_REGION_OUTLET_MISSING'],
    ['duplicate', DuplicateOutletContainer, 'CONTAINER_REGION_DUPLICATE_OUTLET'],
  ])('recovers Region children when the %s outlet configuration is invalid', async (_kind, preview, code) => {
    const designer = createDesigner({
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'container', type: 'container', props: {} },
          { id: 'child', type: 'text', props: {} },
        ],
        structure: {
          root: ['container'],
          containers: { container: { regions: { main: ['child'] } } },
        },
      },
      materials: [
        {
          type: 'container',
          schema: { container: { regions: [{ id: 'main' }] } },
          presentation: { kind: 'visual', preview },
        },
        { type: 'text', presentation: { kind: 'visual', preview: Preview } },
      ],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, {
      instance: designer,
      deviceFrame: { id: 'test', containerShell: FirstDeviceFrame },
    }) })
    try {
      app.mount(host)
      await nextTick()
      await nextTick()
      expect(host.querySelector(`[data-dc-component="container-recovery"][data-dc-diagnostic-code="${code}"]`)).not.toBeNull()
      expect(host.querySelectorAll('[data-dc-component="node"][data-node-id="child"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('renders Region children in Schema order and uses one empty/active/forbidden state', async () => {
    const designer = createDesigner({
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'container', type: 'container', props: {} },
          { id: 'second', type: 'text', props: {} },
          { id: 'first', type: 'text', props: {} },
        ],
        structure: {
          root: ['container'],
          containers: { container: { regions: { main: ['second', 'first'] } } },
        },
      },
      materials: [
        {
          type: 'container',
          schema: { container: { regions: [{ id: 'main' }] } },
          presentation: { kind: 'visual', preview: SingleOutletContainer },
        },
        { type: 'text', presentation: { kind: 'visual', preview: Preview } },
      ],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, {
      instance: designer,
      deviceFrame: { id: 'test', containerShell: FirstDeviceFrame },
    }) })
    try {
      app.mount(host)
      await nextTick()
      const region = host.querySelector<HTMLElement>('[data-dc-container-region="main"]')
      expect(region).not.toBeNull()
      expect(Array.from(region!.querySelectorAll<HTMLElement>(':scope > [data-dc-component="node"]'))
        .map(node => node.dataset.nodeId)).toEqual(['second', 'first'])
      expect(region!.dataset.dcState).toBeUndefined()

      designer.importSchema({
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [{ id: 'container', type: 'container', props: {} }],
        structure: { root: ['container'], containers: { container: { regions: { main: [] } } } },
      })
      await nextTick()
      expect(host.querySelector<HTMLElement>('[data-dc-container-region="main"]')?.dataset.dcState).toBe('empty')
      expect(host.querySelector('[data-dc-container-region="main"] [data-dc-component="empty-state"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })

  it('recovers every Schema Region for unknown and conflicted container owners', async () => {
    const designer = createDesigner({
      schema: {
        version: '1',
        globalConfig: {},
        page: { props: {} },
        nodes: [
          { id: 'unknown', type: 'external-container', props: {} },
          { id: 'conflicted', type: 'container', props: {} },
          { id: 'unknown-child', type: 'text', props: {} },
          { id: 'main-child', type: 'text', props: {} },
          { id: 'side-child', type: 'text', props: {} },
        ],
        structure: {
          root: ['unknown', 'conflicted'],
          containers: {
            unknown: { regions: { external: ['unknown-child'] } },
            conflicted: { regions: { main: ['main-child'], side: ['side-child'] } },
          },
        },
      },
      materials: [
        {
          type: 'container',
          schema: { container: { regions: [{ id: 'main' }] } },
          presentation: { kind: 'visual', preview: SingleOutletContainer },
        },
        { type: 'text', presentation: { kind: 'visual', preview: Preview } },
      ],
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({ render: () => h(DcDesigner, {
      instance: designer,
      deviceFrame: { id: 'test', containerShell: FirstDeviceFrame },
    }) })
    try {
      app.mount(host)
      await nextTick()
      expect(host.querySelectorAll('[data-dc-component="container-recovery"][data-dc-diagnostic-code="CONTAINER_MATERIAL_UNRESOLVED"]')).toHaveLength(2)
      for (const nodeId of ['unknown-child', 'main-child', 'side-child'])
        expect(host.querySelectorAll(`[data-dc-component="node"][data-node-id="${nodeId}"]`)).toHaveLength(1)
      expect(host.querySelector('[data-dc-container-id="conflicted"][data-dc-container-region="side"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
      host.remove()
    }
  })
})
