// @vitest-environment happy-dom
import type { DocumentSchema } from '@dragcraft/core'
import { resolveSchema } from '@dragcraft/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMaterialCatalog } from '../materials/create-material-catalog'
import ApplicationSurface from './application-surface'
import DesignerRegionOutlet from './designer-region-outlet'
import DesignerViewportPortal from './designer-viewport-portal'

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

  it('lets a region outlet replace the default drop geometry resolver', async () => {
    const onDropAnchor = vi.fn()
    const ContainerPreview = defineComponent({
      setup: () => () => h(DesignerRegionOutlet, {
        regionId: 'content',
        resolveDropAnchor: () => ({ kind: 'start' }),
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
