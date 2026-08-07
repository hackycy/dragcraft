// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { MaterialPreviewContext } from './material-preview-context'
import { resolveSchema } from '@dragcraft/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { createMaterialCatalog } from '../materials/create-material-catalog'
import ApplicationSurface from './application-surface'
import DesignerRegionOutlet from './designer-region-outlet'
import DesignerViewportPortal from './designer-viewport-portal'
import { useSurfaceReservation } from './surface-reservation'

function resolveDocument(schema: DocumentSchema, materials: Parameters<typeof createMaterialCatalog>[0]) {
  const result = resolveSchema(schema, createMaterialCatalog(materials).schemaDefinitions)
  if (result.status === 'rejected')
    throw new Error('test schema was rejected')
  return result.document
}

describe('applicationSurface', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('creates one ordered NodeHost per root node and renders a visual preview', async () => {
    const Preview = defineComponent({
      name: 'SurfaceTestPreview',
      setup: () => () => h('article', { 'data-testid': 'visual-preview' }, 'Preview'),
    })
    const materials = [{
      type: 'text',
      presentation: { kind: 'visual' as const, preview: Preview },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'first', type: 'text', props: {} },
        { id: 'second', type: 'text', props: {} },
      ],
      structure: { root: ['first', 'second'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector('[data-dc-component="application-surface"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-plane="document"]')).not.toBeNull()
      expect(Array.from(host.querySelectorAll('[data-dc-component="node-host"]'))
        .map(node => node.getAttribute('data-dc-node-id')))
        .toEqual(['first', 'second'])
      expect(host.querySelectorAll('[data-dc-node-id="first"] [data-testid="visual-preview"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('projects persisted node style onto the unique NodeHost', async () => {
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{
        id: 'styled',
        type: 'text',
        props: {},
        style: { backgroundColor: 'rgb(1, 2, 3)', color: 'white', minHeight: '24px' },
      }],
      structure: { root: ['styled'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      const nodeHost = host.querySelector<HTMLElement>('[data-dc-node-id="styled"]')!
      expect(nodeHost.style.backgroundColor).toBe('rgb(1, 2, 3)')
      expect(nodeHost.style.color).toBe('white')
      expect(nodeHost.style.minHeight).toBe('24px')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('provides a read-only preview context and routes self updates as authoring actions', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    let seenContext: MaterialPreviewContext | undefined
    const Preview = defineComponent({
      props: {
        context: { type: Object as PropType<MaterialPreviewContext>, required: true },
      },
      setup(props) {
        seenContext = props.context
        return () => h('article', { 'data-testid': 'context-preview' })
      },
    })
    const materials = [{
      type: 'text',
      presentation: { kind: 'visual' as const, preview: Preview },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: { locale: 'en-US' },
      page: { props: { title: 'Page' } },
      nodes: [{ id: 'first', type: 'text', props: { label: 'Original' } }],
      structure: { root: ['first'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        execute,
        selectedNodeId: 'first',
        draggingNodeId: 'first',
      }),
    })

    try {
      app.mount(host)
      await nextTick()

      expect(seenContext).toMatchObject({
        node: { id: 'first', type: 'text', props: { label: 'Original' } },
        page: { props: { title: 'Page' } },
        globalConfig: { locale: 'en-US' },
        owner: { kind: 'page-root' },
        selected: true,
        hovered: false,
        dragging: true,
      })
      expect(seenContext).not.toHaveProperty('invokeAction')
      expect(execute).not.toHaveBeenCalled()

      seenContext!.updateSelf({ label: 'Edited' })

      expect(execute).toHaveBeenCalledWith({
        type: 'update-node',
        nodeId: 'first',
        node: { type: 'text', props: { label: 'Edited' } },
      })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('projects selected NodeHost geometry into the private Interaction Plane', async () => {
    const materials = [{
      type: 'text',
      presentation: { kind: 'headless' as const },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'first', type: 'text', props: {} }],
      structure: { root: ['first'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        selectedNodeId: 'first',
      }),
    })

    try {
      app.mount(host)
      await nextTick()

      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const node = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!
      surface.getBoundingClientRect = () => ({
        left: 100,
        top: 200,
        width: 320,
        height: 640,
        right: 420,
        bottom: 840,
      }) as DOMRect
      node.getBoundingClientRect = () => ({
        left: 112,
        top: 224,
        width: 120,
        height: 48,
        right: 232,
        bottom: 272,
      }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      const interaction = host.querySelector('[data-dc-plane="interaction"]')!
      const selection = interaction.querySelector<HTMLElement>('[data-dc-component="node-selection"]')!
      expect(selection).not.toBeNull()
      expect(selection.getAttribute('data-dc-node-id')).toBe('first')
      expect(selection.style.cssText).toContain('left: 12px')
      expect(selection.style.cssText).toContain('top: 24px')
      expect(selection.style.cssText).toContain('width: 120px')
      expect(selection.style.cssText).toContain('height: 48px')
      expect(selection.dataset.dcState).toBe('root-segment')
      expect(Array.from(selection.querySelectorAll('[data-dc-part]')).map(edge => edge.getAttribute('data-dc-part')))
        .toEqual(['block-start-edge', 'inline-end-edge', 'block-end-edge', 'inline-start-edge'])
      expect(host.querySelector('[data-dc-plane="document"] [data-dc-component="node-selection"]')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('projects a selection handle for the hovered unselected NodeHost', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'first', type: 'text', props: {} }],
      structure: { root: ['first'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        execute,
        hoveredNodeId: 'first',
      }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const node = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!
      surface.getBoundingClientRect = () => ({ left: 100, top: 200 }) as DOMRect
      node.getBoundingClientRect = () => ({ left: 112, top: 224, width: 120, height: 48, right: 232, bottom: 272 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      const handle = host.querySelector<HTMLButtonElement>(
        '[data-dc-plane="interaction"] [data-dc-component="node-handle"]',
      )!
      expect(handle.title).toBe('选中组件')
      expect(handle.style.left).toBe('100px')
      expect(handle.style.top).toBe('28px')

      handle.click()
      expect(execute).toHaveBeenCalledWith({ type: 'select-node', nodeId: 'first' })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('keeps Container Owner selection entry and Region child selection projection distinct', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'child', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['child'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const selectedNodeId = ref<string | undefined>()
    const hoveredNodeId = ref<string | undefined>('stack')
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(defineComponent({
      setup: () => () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        execute,
        hoveredNodeId: hoveredNodeId.value,
        selectedNodeId: selectedNodeId.value,
      }),
    }))

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const container = host.querySelector<HTMLElement>('[data-dc-node-id="stack"]')!
      const child = host.querySelector<HTMLElement>('[data-dc-node-id="child"]')!
      surface.getBoundingClientRect = () => ({ left: 100, top: 200 }) as DOMRect
      container.getBoundingClientRect = () => ({
        left: 112,
        top: 224,
        right: 432,
        bottom: 344,
        width: 320,
        height: 120,
      }) as DOMRect
      child.getBoundingClientRect = () => ({
        left: 128,
        top: 256,
        right: 408,
        bottom: 296,
        width: 280,
        height: 40,
      }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      const handle = host.querySelector<HTMLButtonElement>('[data-dc-component="node-handle"]')!
      expect(handle.style.left).toBe('0px')
      expect(handle.style.transform).toBe('translateX(calc(-100% - 8px))')

      hoveredNodeId.value = undefined
      selectedNodeId.value = 'stack'
      await nextTick()

      const rootSelection = host.querySelector<HTMLElement>('[data-dc-component="node-selection"]')!
      const rootToolbar = host.querySelector<HTMLElement>('[data-dc-component="node-toolbar"]')!
      expect(rootSelection.dataset.dcState).toBe('root-segment')
      expect(rootToolbar.dataset.placement).toBe('left-start')
      expect(rootToolbar.dataset.orientation).toBe('vertical')

      selectedNodeId.value = 'child'
      await nextTick()

      const regionSelection = host.querySelector<HTMLElement>('[data-dc-component="node-selection"]')!
      const regionToolbar = host.querySelector<HTMLElement>('[data-dc-component="node-toolbar"]')!
      expect(regionSelection.dataset.dcState).toBe('material-bounds')
      expect(regionToolbar.dataset.orientation).toBe('horizontal')
      expect(regionToolbar.dataset.placement).toMatch(/^(top|bottom)-end$/)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('routes root drop anchors and feedback through the Interaction Plane', async () => {
    const onDropAnchor = vi.fn()
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'first', type: 'text', props: {} },
        { id: 'second', type: 'text', props: {} },
      ],
      structure: { root: ['first', 'second'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, onDropAnchor }),
    })

    try {
      app.mount(host)
      await nextTick()

      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const documentPlane = host.querySelector<HTMLElement>('[data-dc-plane="document"]')!
      const first = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!
      const second = host.querySelector<HTMLElement>('[data-dc-node-id="second"]')!
      surface.getBoundingClientRect = () => ({ left: 80, top: 100 }) as DOMRect
      first.getBoundingClientRect = () => ({ left: 88, top: 110, right: 388, bottom: 150, width: 300, height: 40 }) as DOMRect
      second.getBoundingClientRect = () => ({ left: 88, top: 150, right: 388, bottom: 190, width: 300, height: 40 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))

      const dragover = new Event('dragover', { bubbles: true, cancelable: true }) as DragEvent
      Object.defineProperty(dragover, 'clientY', { value: 160 })
      documentPlane.dispatchEvent(dragover)
      await nextTick()

      expect(onDropAnchor).toHaveBeenCalledWith({
        owner: { kind: 'page-root' },
        position: { kind: 'before', nodeId: 'second' },
      })
      const indicator = host.querySelector<HTMLElement>(
        '[data-dc-plane="interaction"] [data-dc-component="drop-indicator"]',
      )!
      expect(indicator).not.toBeNull()
      expect(indicator.style.cssText).toContain('top: 50px')

      documentPlane.dispatchEvent(new Event('dragleave', { bubbles: true }))
      await nextTick()
      expect(host.querySelector(
        '[data-dc-plane="interaction"] [data-dc-component="drop-indicator"]',
      )).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('shows root drop feedback when the document plane is empty', async () => {
    const onDropAnchor = vi.fn()
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [],
      structure: { root: [], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, onDropAnchor }),
    })

    try {
      app.mount(host)
      await nextTick()
      const documentPlane = host.querySelector<HTMLElement>('[data-dc-plane="document"]')!
      const emptyState = documentPlane.querySelector<HTMLElement>('[data-dc-component="empty-state"]')!
      expect(emptyState.querySelector('[data-dc-part="text"]')?.textContent).toBe('拖拽组件到这里')

      documentPlane.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))
      await nextTick()

      expect(onDropAnchor).toHaveBeenCalledWith({
        owner: { kind: 'page-root' },
        position: { kind: 'end' },
      })
      const indicator = host.querySelector<HTMLElement>(
        '[data-dc-plane="interaction"] [data-dc-component="drop-indicator"]',
      )!
      expect(indicator).not.toBeNull()
      expect(indicator.dataset.dcState).toBe('empty end')
      expect(indicator.style.inset).toBe('8px')
      expect(documentPlane.querySelector('[data-dc-component="empty-state"]')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('shows end-anchor feedback after the last region child', async () => {
    const onDropAnchor = vi.fn()
    let dropPosition: 'start' | 'end' = 'end'
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, {
        regionId: 'content',
        resolveDropAnchor: () => ({ kind: dropPosition }),
      }),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'child', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['child'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, onDropAnchor }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const child = host.querySelector<HTMLElement>('[data-dc-node-id="child"]')!
      const region = host.querySelector<HTMLElement>('[data-dc-region-outlet="content"]')!
      surface.getBoundingClientRect = () => ({ left: 80, top: 100 }) as DOMRect
      child.getBoundingClientRect = () => ({ left: 88, top: 150, right: 388, bottom: 190, width: 300, height: 40 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))

      region.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))
      await nextTick()

      expect(onDropAnchor).toHaveBeenCalledWith({
        owner: { kind: 'container-region', containerId: 'stack', regionId: 'content' },
        position: { kind: 'end' },
      })
      const indicator = host.querySelector<HTMLElement>(
        '[data-dc-plane="interaction"] [data-dc-component="drop-indicator"]',
      )!
      expect(indicator.dataset.dcState).toBe('end')
      expect(indicator.style.top).toBe('90px')
      expect(indicator.style.left).toBe('8px')
      expect(indicator.style.width).toBe('300px')

      dropPosition = 'start'
      region.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))
      await nextTick()

      const startIndicator = host.querySelector<HTMLElement>(
        '[data-dc-plane="interaction"] [data-dc-component="drop-indicator"]',
      )!
      expect(startIndicator.dataset.dcState).toBe('start')
      expect(startIndicator.style.top).toBe('50px')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('shows empty-region feedback through the Interaction Plane', async () => {
    const onDropAnchor = vi.fn()
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    })
    const materials = [{
      type: 'stack',
      schema: { container: { regions: [{ id: 'content' }] } },
      presentation: { kind: 'visual' as const, preview: ContainerPreview },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'stack', type: 'stack', props: {} }],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: [] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, onDropAnchor }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const region = host.querySelector<HTMLElement>('[data-dc-region-outlet="content"]')!
      surface.getBoundingClientRect = () => ({ left: 80, top: 100 }) as DOMRect
      region.getBoundingClientRect = () => ({ left: 92, top: 136, right: 372, bottom: 256, width: 280, height: 120 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))

      region.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))
      await nextTick()

      const indicator = host.querySelector<HTMLElement>(
        '[data-dc-plane="interaction"] [data-dc-component="drop-indicator"]',
      )!
      expect(indicator).not.toBeNull()
      expect(indicator.dataset.dcState).toBe('empty end')
      expect(indicator.style.left).toBe('12px')
      expect(indicator.style.top).toBe('36px')
      expect(indicator.style.width).toBe('280px')
      expect(indicator.style.height).toBe('120px')
      expect(region.querySelector('[data-dc-component="drop-indicator"]')).toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('measures edge reservations in stable root order and exposes frame offsets', async () => {
    const Preview = defineComponent({ setup: () => () => h('span', 'Preview') })
    const EdgeFrame = defineComponent({
      setup(_, { slots }) {
        const element = ref<HTMLElement | null>(null)
        const reservation = useSurfaceReservation(element, {
          edge: 'block-start',
          fallbackSize: 10,
        })
        return () => h('aside', {
          'ref': element,
          'data-testid': 'edge-frame',
          'style': { insetBlockStart: `${reservation.offset.value}px` },
        }, slots.default?.())
      },
    })
    const materials = [{
      type: 'bar',
      presentation: { kind: 'visual' as const, preview: Preview, frame: EdgeFrame },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'first', type: 'bar', props: {} },
        { id: 'second', type: 'bar', props: {} },
      ],
      structure: { root: ['first', 'second'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      const frames = Array.from(host.querySelectorAll<HTMLElement>('[data-testid="edge-frame"]'))
      frames[0]!.getBoundingClientRect = () => ({ width: 320, height: 24 }) as DOMRect
      frames[1]!.getBoundingClientRect = () => ({ width: 320, height: 36 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      expect(frames[0]!.style.insetBlockStart).toBe('0px')
      expect(frames[1]!.style.insetBlockStart).toBe('24px')
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      expect(surface.style.getPropertyValue('--dc-internal-application-surface-reservation-block-start'))
        .toBe('60px')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('normalizes edge reservation sizes through the surface transform', async () => {
    const Preview = defineComponent({ setup: () => () => h('span', 'Preview') })
    const EdgeFrame = defineComponent({
      setup(_, { slots }) {
        const element = ref<HTMLElement | null>(null)
        useSurfaceReservation(element, {
          edge: 'block-start',
          fallbackSize: 10,
        })
        return () => h('aside', {
          'ref': element,
          'data-testid': 'scaled-edge-frame',
        }, slots.default?.())
      },
    })
    const materials = [{
      type: 'bar',
      presentation: { kind: 'visual' as const, preview: Preview, frame: EdgeFrame },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'bar', type: 'bar', props: {} }],
      structure: { root: ['bar'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const frame = host.querySelector<HTMLElement>('[data-testid="scaled-edge-frame"]')!
      Object.defineProperty(surface, 'offsetWidth', { configurable: true, value: 320 })
      Object.defineProperty(surface, 'offsetHeight', { configurable: true, value: 400 })
      surface.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 640,
        height: 800,
        right: 640,
        bottom: 800,
      }) as DOMRect
      frame.getBoundingClientRect = () => ({ width: 640, height: 48 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      expect(surface.style.getPropertyValue('--dc-internal-application-surface-reservation-block-start'))
        .toBe('24px')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('recomputes reservation order when the resolved root order changes', async () => {
    const Preview = defineComponent({ setup: () => () => h('span', 'Preview') })
    const EdgeFrame = defineComponent({
      setup(_, { slots }) {
        const element = ref<HTMLElement | null>(null)
        const reservation = useSurfaceReservation(element, {
          edge: 'block-start',
          fallbackSize: 10,
        })
        return () => h('aside', {
          'ref': element,
          'data-testid': 'dynamic-edge-frame',
          'style': { insetBlockStart: `${reservation.offset.value}px` },
        }, slots.default?.())
      },
    })
    const materials = [{
      type: 'bar',
      presentation: { kind: 'visual' as const, preview: Preview, frame: EdgeFrame },
    }]
    const firstSchema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'first', type: 'bar', props: {} },
        { id: 'second', type: 'bar', props: {} },
      ],
      structure: { root: ['first', 'second'], containers: {} },
    }
    const secondSchema = { ...firstSchema, structure: { root: ['second', 'first'], containers: {} } }
    const catalog = createMaterialCatalog(materials)
    const currentDocument = ref(resolveDocument(firstSchema, materials))
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(defineComponent({
      setup: () => () => h(ApplicationSurface, {
        document: currentDocument.value,
        catalog,
      }),
    }))

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const firstFrame = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!.closest<HTMLElement>('[data-testid="dynamic-edge-frame"]')!
      const secondFrame = host.querySelector<HTMLElement>('[data-dc-node-id="second"]')!.closest<HTMLElement>('[data-testid="dynamic-edge-frame"]')!
      surface.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
      firstFrame.getBoundingClientRect = () => ({ width: 320, height: 24 }) as DOMRect
      secondFrame.getBoundingClientRect = () => ({ width: 320, height: 36 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      currentDocument.value = resolveDocument(secondSchema, materials)
      await nextTick()

      expect(host.querySelector<HTMLElement>('[data-dc-node-id="second"]')!
        .closest<HTMLElement>('[data-testid="dynamic-edge-frame"]')!.style.insetBlockStart)
        .toBe('0px')
      expect(host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!
        .closest<HTMLElement>('[data-testid="dynamic-edge-frame"]')!.style.insetBlockStart)
        .toBe('36px')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('routes the selected-node remove toolbar action through Authoring execute', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'first', type: 'text', props: {} }],
      structure: { root: ['first'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        execute,
        selectedNodeId: 'first',
      }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const node = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!
      surface.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
      node.getBoundingClientRect = () => ({ left: 10, top: 20, right: 110, bottom: 60, width: 100, height: 40 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      const remove = host.querySelector<HTMLButtonElement>(
        '[data-dc-plane="interaction"] [data-dc-component="node-toolbar"] [data-dc-action="remove"]',
      )!
      const toolbar = remove.closest<HTMLElement>('[data-dc-component="node-toolbar"]')!
      expect(remove).not.toBeNull()
      expect(toolbar.dataset.placement).toBe('left-start')
      expect(toolbar.dataset.orientation).toBe('vertical')
      expect(toolbar.style.left).toBe('0px')
      expect(toolbar.style.transform).toBe('translateX(calc(-100% - 8px))')
      remove.click()

      expect(execute).toHaveBeenCalledWith({ type: 'remove-node', nodeId: 'first' })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('starts node dragging from the selected-node toolbar affordance', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const onNodeDragStart = vi.fn()
    const onNodeDragEnd = vi.fn()
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'first', type: 'text', props: {} }],
      structure: { root: ['first'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        execute,
        onNodeDragStart,
        onNodeDragEnd,
        selectedNodeId: 'first',
      }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const node = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!
      surface.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
      node.getBoundingClientRect = () => ({ left: 10, top: 20, right: 110, bottom: 60, width: 100, height: 40 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      const drag = host.querySelector<HTMLElement>('[data-dc-action="drag"]')!
      expect(drag).not.toBeNull()
      expect(drag.getAttribute('draggable')).toBe('true')
      expect(node.hasAttribute('draggable')).toBe(false)
      expect(['drag', 'move-up', 'move-down', 'duplicate', 'remove'].map((action) => {
        return host.querySelector<HTMLElement>(`[data-dc-action="${action}"]`)?.title
      })).toEqual(['拖拽排序', '上移', '下移', '复制', '删除'])

      drag.dispatchEvent(new DragEvent('dragstart', { bubbles: true }))
      drag.dispatchEvent(new DragEvent('dragend', { bubbles: true }))
      expect(onNodeDragStart).toHaveBeenCalledWith(expect.any(DragEvent), 'first')
      expect(onNodeDragEnd).toHaveBeenCalledOnce()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('routes duplicate toolbar actions with a structural destination', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'first', type: 'text', props: {} }],
      structure: { root: ['first'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        execute,
        selectedNodeId: 'first',
      }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const node = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!
      surface.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
      node.getBoundingClientRect = () => ({ left: 10, top: 20, right: 110, bottom: 60, width: 100, height: 40 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      host.querySelector<HTMLButtonElement>('[data-dc-action="duplicate"]')!.click()

      expect(execute).toHaveBeenCalledWith({
        type: 'duplicate-node',
        nodeId: 'first',
        to: {
          owner: { kind: 'page-root' },
          position: { kind: 'after', nodeId: 'first' },
        },
      })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('routes region reorder toolbar actions with owner-relative anchors', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'first', type: 'text', props: {} },
        { id: 'middle', type: 'text', props: {} },
        { id: 'last', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['first', 'middle', 'last'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, {
        document: resolved,
        catalog,
        execute,
        selectedNodeId: 'middle',
      }),
    })

    try {
      app.mount(host)
      await nextTick()
      const surface = host.querySelector<HTMLElement>('[data-dc-component="application-surface"]')!
      const middle = host.querySelector<HTMLElement>('[data-dc-node-id="middle"]')!
      surface.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect
      middle.getBoundingClientRect = () => ({ left: 10, top: 20, right: 110, bottom: 60, width: 100, height: 40 }) as DOMRect
      window.dispatchEvent(new Event('resize'))
      await new Promise(resolve => window.requestAnimationFrame(() => resolve(undefined)))
      await nextTick()

      const toolbar = host.querySelector<HTMLElement>('[data-dc-component="node-toolbar"]')!
      expect(toolbar.dataset.placement).toBe('bottom-end')
      expect(toolbar.dataset.orientation).toBe('horizontal')
      expect(toolbar.style.left).toBe('')
      expect(toolbar.style.getPropertyValue('--dc-internal-node-toolbar-anchor-inline-end')).toBe('110px')
      expect(toolbar.style.top).toBe('68px')

      host.querySelector<HTMLButtonElement>('[data-dc-action="move-up"]')!.click()
      host.querySelector<HTMLButtonElement>('[data-dc-action="move-down"]')!.click()

      expect(execute.mock.calls).toEqual([
        [{
          type: 'move-node',
          nodeId: 'middle',
          to: {
            owner: { kind: 'container-region', containerId: 'stack', regionId: 'content' },
            position: { kind: 'before', nodeId: 'first' },
          },
        }],
        [{
          type: 'move-node',
          nodeId: 'middle',
          to: {
            owner: { kind: 'container-region', containerId: 'stack', regionId: 'content' },
            position: { kind: 'after', nodeId: 'last' },
          },
        }],
      ])
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('routes NodeHost selection and hover through Authoring execute', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const materials = [{ type: 'text', presentation: { kind: 'headless' as const } }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'first', type: 'text', props: {} }],
      structure: { root: ['first'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, execute }),
    })

    try {
      app.mount(host)
      await nextTick()
      const node = host.querySelector<HTMLElement>('[data-dc-node-id="first"]')!

      node.dispatchEvent(new MouseEvent('mouseenter'))
      node.click()
      node.dispatchEvent(new MouseEvent('mouseleave'))

      expect(execute.mock.calls).toEqual([
        [{ type: 'hover-node', nodeId: 'first' }],
        [{ type: 'select-node', nodeId: 'first' }],
        [{ type: 'hover-node', nodeId: null }],
      ])
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('uses a selection mask by default without taking over unmasked or Container Owner preview input', async () => {
    const execute = vi.fn(() => ({ status: 'committed' as const }))
    const defaultPreviewClicks = vi.fn()
    const unmaskedPreviewClicks = vi.fn()
    const containerPreviewClicks = vi.fn()
    const DefaultPreview = defineComponent({
      setup: () => () => h('button', {
        'data-testid': 'default-preview-button',
        'onClick': defaultPreviewClicks,
      }, 'Default preview action'),
    })
    const UnmaskedPreview = defineComponent({
      setup: () => () => h('button', {
        'data-testid': 'unmasked-preview-button',
        'style': { position: 'relative', zIndex: 2 },
        'onClick': unmaskedPreviewClicks,
      }, 'Unmasked preview action'),
    })
    const ContainerPreview = defineComponent({
      setup: () => () => h('button', {
        'data-testid': 'container-preview-button',
        'onClick': containerPreviewClicks,
      }, 'Container preview action'),
    })
    const materials = [
      { type: 'default', presentation: { kind: 'visual' as const, preview: DefaultPreview } },
      { type: 'unmasked', presentation: { kind: 'visual' as const, preview: UnmaskedPreview } },
      {
        type: 'container',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'default', type: 'default', props: {} },
        { id: 'unmasked', type: 'unmasked', props: {} },
        { id: 'container', type: 'container', props: {} },
      ],
      structure: {
        root: ['default', 'unmasked', 'container'],
        containers: { container: { regions: { content: [] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, execute }),
    })

    try {
      app.mount(host)
      await nextTick()

      const defaultMask = host.querySelector<HTMLButtonElement>(
        '[data-dc-node-id="default"] .dc-internal-node-host__selection-mask',
      )!
      defaultMask.click()
      expect(defaultPreviewClicks).not.toHaveBeenCalled()
      expect(execute).toHaveBeenCalledWith({ type: 'select-node', nodeId: 'default' })

      execute.mockClear()
      host.querySelector<HTMLButtonElement>('[data-testid="unmasked-preview-button"]')!.click()
      expect(unmaskedPreviewClicks).toHaveBeenCalledOnce()
      expect(execute).not.toHaveBeenCalled()

      host.querySelector<HTMLButtonElement>('[data-testid="container-preview-button"]')!.click()
      expect(containerPreviewClicks).toHaveBeenCalledOnce()
      expect(execute).not.toHaveBeenCalled()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('renders explicit headless and unknown materials through distinct read-only paths', async () => {
    const materials = [{
      type: 'analytics',
      presentation: { kind: 'headless' as const },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'headless', type: 'analytics', props: {} },
        { id: 'unknown', type: 'remote-card', props: { source: 'remote' } },
      ],
      structure: { root: ['headless', 'unknown'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector('[data-dc-node-id="headless"] [data-dc-material="headless"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-node-id="unknown"] [data-dc-material="unknown"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-node-id="unknown"]')?.getAttribute('aria-readonly')).toBe('true')
      expect(host.querySelector('[data-dc-node-id="unknown"]')?.textContent).toContain('remote-card')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('renders region children once in their resolved structural order', async () => {
    const ChildPreview = defineComponent({
      setup: () => () => h('p', { 'data-testid': 'child-preview' }),
    })
    const ContainerPreview = defineComponent({
      setup: () => () => h('section', [
        h(DesignerRegionOutlet, { regionId: 'content' }),
      ]),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      {
        type: 'text',
        presentation: { kind: 'visual' as const, preview: ChildPreview },
      },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'second', type: 'text', props: {} },
        { id: 'first', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['second', 'first'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      const outlet = host.querySelector('[data-dc-region-outlet="content"]')!
      expect(Array.from(outlet.querySelectorAll('[data-dc-component="node-host"]'))
        .map(node => node.getAttribute('data-dc-node-id')))
        .toEqual(['second', 'first'])
      expect(host.querySelectorAll('[data-dc-component="node-host"]')).toHaveLength(3)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('updates region children when the resolved structural order changes', async () => {
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const firstSchema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'first', type: 'text', props: {} },
        { id: 'second', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['first', 'second'] } } },
      },
    }
    const secondSchema: DocumentSchema = {
      ...firstSchema,
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['second', 'first'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const currentDocument = ref(resolveDocument(firstSchema, materials))
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(defineComponent({
      setup: () => () => h(ApplicationSurface, {
        document: currentDocument.value,
        catalog,
      }),
    }))

    try {
      app.mount(host)
      await nextTick()
      currentDocument.value = resolveDocument(secondSchema, materials)
      await nextTick()

      const outlet = host.querySelector('[data-dc-region-outlet="content"]')!
      expect(Array.from(outlet.querySelectorAll('[data-dc-component="node-host"]'))
        .map(node => node.getAttribute('data-dc-node-id')))
        .toEqual(['second', 'first'])
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('recovers children when a visual container omits a declared region outlet', async () => {
    const ContainerPreview = defineComponent({
      setup: () => () => h('section', 'Missing outlet'),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'child', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['child'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()
      await nextTick()

      const recovery = host.querySelector('[data-dc-recovery-region="content"]')!
      expect(recovery).not.toBeNull()
      expect(recovery.querySelector('[data-dc-node-id="child"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-presentation-diagnostic="REGION_OUTLET_MISSING"]')).not.toBeNull()
      expect(host.querySelector(
        '[data-dc-plane="interaction"] [data-dc-presentation-diagnostic="REGION_OUTLET_MISSING"]',
      )).not.toBeNull()
      expect(host.querySelectorAll('[data-dc-node-id="child"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('reports duplicate region outlets without duplicating child NodeHosts', async () => {
    const ContainerPreview = defineComponent({
      setup: () => () => h('section', [
        h(DesignerRegionOutlet, { regionId: 'content' }),
        h(DesignerRegionOutlet, { regionId: 'content' }),
      ]),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'child', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['child'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelectorAll('[data-dc-node-id="child"]')).toHaveLength(1)
      expect(host.querySelector('[data-dc-presentation-diagnostic="REGION_OUTLET_DUPLICATE"]')).not.toBeNull()
      expect(host.querySelector(
        '[data-dc-plane="interaction"] [data-dc-presentation-diagnostic="REGION_OUTLET_DUPLICATE"]',
      )).not.toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('creates every declared region outlet for a headless container proxy', async () => {
    const materials = [
      {
        type: 'headless-stack',
        schema: { container: { regions: [{ id: 'before' }, { id: 'after' }] } },
        presentation: { kind: 'headless' as const },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'headless-stack', props: {} },
        { id: 'child', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: {
          stack: { regions: { before: [], after: ['child'] } },
        },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      const proxy = host.querySelector('[data-dc-node-id="stack"] [data-dc-material="headless"]')!
      expect(Array.from(proxy.querySelectorAll('[data-dc-region-outlet]'))
        .map(outlet => outlet.getAttribute('data-dc-region-outlet')))
        .toEqual(['before', 'after'])
      expect(proxy.querySelector('[data-dc-region-outlet="after"] [data-dc-node-id="child"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('preserves unknown container children in read-only recovery regions', async () => {
    const materials = [
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'external-container', type: 'remote-stack', props: {} },
        { id: 'child', type: 'text', props: {} },
      ],
      structure: {
        root: ['external-container'],
        containers: {
          'external-container': { regions: { legacy: ['child'] } },
        },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      const fallback = host.querySelector('[data-dc-node-id="external-container"] [data-dc-material="unknown"]')!
      expect(fallback.getAttribute('aria-readonly')).toBe('true')
      expect(fallback.querySelector('[data-dc-recovery-region="legacy"] [data-dc-node-id="child"]')).not.toBeNull()
      expect(host.querySelectorAll('[data-dc-node-id="child"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('wraps the complete NodeHost with a visual material PresentationFrame', async () => {
    const Preview = defineComponent({
      setup: () => () => h('p', { 'data-testid': 'framed-preview' }),
    })
    const Frame = defineComponent({
      setup(_, { slots }) {
        return () => h('aside', { 'data-testid': 'presentation-frame' }, slots.default?.())
      },
    })
    const materials = [{
      type: 'floating',
      presentation: { kind: 'visual' as const, preview: Preview, frame: Frame },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'floating', type: 'floating', props: {} }],
      structure: { root: ['floating'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()

      const frame = host.querySelector('[data-testid="presentation-frame"]')!
      expect(frame.querySelectorAll('[data-dc-component="node-host"]')).toHaveLength(1)
      expect(frame.querySelector('[data-dc-component="node-host"] [data-testid="framed-preview"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('recovers a visual NodeHost when its PresentationFrame omits the slot', async () => {
    const Preview = defineComponent({
      setup: () => () => h('p', { 'data-testid': 'recovered-preview' }),
    })
    const MissingSlotFrame = defineComponent({
      setup: () => () => h('aside', { 'data-testid': 'broken-frame' }),
    })
    const materials = [{
      type: 'broken',
      presentation: {
        kind: 'visual' as const,
        preview: Preview,
        frame: MissingSlotFrame,
      },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'broken', type: 'broken', props: {} }],
      structure: { root: ['broken'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()
      await nextTick()

      const recovery = host.querySelector('[data-dc-frame-recovery="broken"]')!
      expect(recovery).not.toBeNull()
      expect(recovery.getAttribute('data-dc-presentation-diagnostic')).toBe('FRAME_SLOT_MISSING')
      expect(recovery.querySelectorAll('[data-dc-component="node-host"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-testid="recovered-preview"]')).toHaveLength(1)
      expect(host.querySelector(
        '[data-dc-plane="interaction"] [data-dc-presentation-diagnostic="FRAME_SLOT_MISSING"]',
      )).not.toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('recovers a visual NodeHost when its PresentationFrame mounts the slot twice', async () => {
    const Preview = defineComponent({
      setup: () => () => h('p', { 'data-testid': 'duplicate-frame-preview' }),
    })
    const DuplicateSlotFrame = defineComponent({
      setup(_, { slots }) {
        return () => h('aside', [slots.default?.(), slots.default?.()])
      },
    })
    const materials = [{
      type: 'duplicate-frame',
      presentation: {
        kind: 'visual' as const,
        preview: Preview,
        frame: DuplicateSlotFrame,
      },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'duplicate-frame', type: 'duplicate-frame', props: {} }],
      structure: { root: ['duplicate-frame'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()
      await nextTick()

      const recovery = host.querySelector('[data-dc-frame-recovery="duplicate-frame"]')!
      expect(recovery.getAttribute('data-dc-presentation-diagnostic')).toBe('FRAME_SLOT_DUPLICATE')
      expect(host.querySelectorAll('[data-dc-node-id="duplicate-frame"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-testid="duplicate-frame-preview"]')).toHaveLength(1)
      expect(host.querySelector(
        '[data-dc-plane="interaction"] [data-dc-presentation-diagnostic="FRAME_SLOT_DUPLICATE"]',
      )).not.toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('mounts a root-owned framed NodeHost in the private Viewport Plane', async () => {
    const Preview = defineComponent({
      setup: () => () => h('p', { 'data-testid': 'viewport-preview' }),
    })
    const ViewportFrame = defineComponent({
      setup(_, { slots }) {
        return () => h(DesignerViewportPortal, null, slots)
      },
    })
    const materials = [{
      type: 'dialog',
      presentation: {
        kind: 'visual' as const,
        preview: Preview,
        frame: ViewportFrame,
      },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'dialog', type: 'dialog', props: {} }],
      structure: { root: ['dialog'], containers: {} },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()
      await nextTick()

      expect(host.querySelector('[data-dc-plane="viewport"] [data-dc-node-id="dialog"]')).not.toBeNull()
      expect(document.body.querySelectorAll('[data-dc-node-id="dialog"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('rejects a region-child viewport portal and recovers it in its outlet', async () => {
    const ViewportFrame = defineComponent({
      setup(_, { slots }) {
        return () => h(DesignerViewportPortal, null, slots)
      },
    })
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      {
        type: 'dialog',
        presentation: {
          kind: 'visual' as const,
          preview: defineComponent({ setup: () => () => h('p', 'Dialog') }),
          frame: ViewportFrame,
        },
      },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'dialog', type: 'dialog', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['dialog'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog }),
    })

    try {
      app.mount(host)
      await nextTick()
      await nextTick()

      expect(host.querySelector('[data-dc-region-outlet="content"] [data-dc-node-id="dialog"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-plane="viewport"] [data-dc-node-id="dialog"]')).toBeNull()
      expect(host.querySelector('[data-dc-presentation-diagnostic="VIEWPORT_PORTAL_REGION_CHILD"]')).not.toBeNull()
      expect(host.querySelector(
        '[data-dc-plane="interaction"] [data-dc-presentation-diagnostic="VIEWPORT_PORTAL_REGION_CHILD"]',
      )).not.toBeNull()
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('resolves the default region drop geometry to a structural anchor', async () => {
    const onDropAnchor = vi.fn()
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      { type: 'text', presentation: { kind: 'headless' as const } },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'first', type: 'text', props: {} },
        { id: 'second', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['first', 'second'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, onDropAnchor }),
    })

    try {
      app.mount(host)
      await nextTick()

      const outlet = host.querySelector<HTMLElement>('[data-dc-region-outlet="content"]')!
      const [first, second] = Array.from(outlet.querySelectorAll<HTMLElement>(':scope > [data-dc-component="node-host"]'))
      first!.getBoundingClientRect = () => ({ top: 0, bottom: 20, height: 20 }) as DOMRect
      second!.getBoundingClientRect = () => ({ top: 20, bottom: 40, height: 20 }) as DOMRect
      const dragover = new Event('dragover', { bubbles: true, cancelable: true }) as DragEvent
      Object.defineProperty(dragover, 'clientY', { value: 25 })
      outlet.dispatchEvent(dragover)

      expect(onDropAnchor).toHaveBeenCalledWith({
        owner: { kind: 'container-region', containerId: 'stack', regionId: 'content' },
        position: { kind: 'before', nodeId: 'second' },
      })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('resolves framed region children by their NodeHost geometry', async () => {
    const onDropAnchor = vi.fn()
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, { regionId: 'content' }),
    })
    const ChildPreview = defineComponent({
      setup: () => () => h('span', 'Child'),
    })
    const ChildFrame = defineComponent({
      setup(_, { slots }) {
        return () => h('article', { 'data-testid': 'child-frame' }, slots.default?.())
      },
    })
    const materials = [
      {
        type: 'stack',
        schema: { container: { regions: [{ id: 'content' }] } },
        presentation: { kind: 'visual' as const, preview: ContainerPreview },
      },
      {
        type: 'text',
        presentation: {
          kind: 'visual' as const,
          preview: ChildPreview,
          frame: ChildFrame,
        },
      },
    ]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [
        { id: 'stack', type: 'stack', props: {} },
        { id: 'first', type: 'text', props: {} },
        { id: 'second', type: 'text', props: {} },
      ],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: ['first', 'second'] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, onDropAnchor }),
    })

    try {
      app.mount(host)
      await nextTick()
      const outlet = host.querySelector<HTMLElement>('[data-dc-region-outlet="content"]')!
      const [first, second] = Array.from(
        outlet.querySelectorAll<HTMLElement>('[data-dc-component="node-host"]'),
      )
      first!.getBoundingClientRect = () => ({ top: 0, bottom: 20, height: 20 }) as DOMRect
      second!.getBoundingClientRect = () => ({ top: 20, bottom: 40, height: 20 }) as DOMRect
      const dragover = new Event('dragover', { bubbles: true, cancelable: true }) as DragEvent
      Object.defineProperty(dragover, 'clientY', { value: 25 })
      outlet.dispatchEvent(dragover)

      expect(onDropAnchor).toHaveBeenCalledWith({
        owner: { kind: 'container-region', containerId: 'stack', regionId: 'content' },
        position: { kind: 'before', nodeId: 'second' },
      })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('lets a region outlet replace the default drop geometry resolver', async () => {
    const onDropAnchor = vi.fn()
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, {
        regionId: 'content',
        resolveDropAnchor: () => ({ kind: 'start' as const }),
      }),
    })
    const materials = [{
      type: 'stack',
      schema: { container: { regions: [{ id: 'content' }] } },
      presentation: { kind: 'visual' as const, preview: ContainerPreview },
    }]
    const schema: DocumentSchema = {
      version: '1',
      globalConfig: {},
      page: { props: {} },
      nodes: [{ id: 'stack', type: 'stack', props: {} }],
      structure: {
        root: ['stack'],
        containers: { stack: { regions: { content: [] } } },
      },
    }
    const catalog = createMaterialCatalog(materials)
    const resolved = resolveDocument(schema, materials)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(ApplicationSurface, { document: resolved, catalog, onDropAnchor }),
    })

    try {
      app.mount(host)
      await nextTick()

      const outlet = host.querySelector<HTMLElement>('[data-dc-region-outlet="content"]')!
      outlet.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))

      expect(onDropAnchor).toHaveBeenCalledWith({
        owner: { kind: 'container-region', containerId: 'stack', regionId: 'content' },
        position: { kind: 'start' },
      })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })
})
