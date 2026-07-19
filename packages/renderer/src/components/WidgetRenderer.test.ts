import type { DesignerEngine, DesignerSchema, NodeOwner, SchemaNode, WidgetMeta } from '@dragcraft/core'
// @vitest-environment happy-dom
import type { Component, VNode } from 'vue'
import type { NodeActionRegistry, ResolvedNodeAction } from '../action-registry'
import type { NodeSelectionPresentationHost } from '../selection-presentation'
import type { RendererContext } from '../types'
import { CommandType, createEngine } from '@dragcraft/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { createNodeSelectionPresentation, NODE_SELECTION_PRESENTATION_KEY } from '../selection-presentation'
import { RENDERER_CONTEXT_KEY } from '../types'
import { useWidgetRuntime } from '../widget-runtime'
import ContainerRegionOutlet from './ContainerRegionOutlet'
import RootRenderer from './RootRenderer'
import WidgetRenderer from './WidgetRenderer'

function makeMeta(overrides?: Partial<WidgetMeta>): WidgetMeta {
  return {
    type: 'floating-button',
    title: 'Floating Button',
    group: 'action',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
  } as WidgetMeta
}

function makeContext(meta: WidgetMeta): RendererContext {
  const selectedNodeId = ref<string | null>(null)
  const hoveredNodeId = ref<string | null>(null)
  const dragTarget = ref(null)
  const selectNode = vi.fn((id: string | null) => {
    selectedNodeId.value = id
  })
  const hoverNode = vi.fn((id: string | null) => {
    hoveredNodeId.value = id
  })
  const schema: DesignerSchema = {
    version: '1.0.0',
    globalConfig: {},
    root: { id: 'root', type: 'root', props: {}, children: [] },
  }
  return {
    engine: {
      execute: vi.fn(),
      store: {
        schema: ref(schema),
        selectedNodeId,
        hoveredNodeId,
        dragTarget,
        selectNode,
        hoverNode,
      },
      state: {
        getSchema: () => schema,
        getNodeById: (id: string) => schema.root.children?.find(node => node.id === id) ?? null,
        getSelectedNodeId: () => null,
        getHoveredNodeId: () => null,
        getDragTarget: () => null,
      },
      registry: {
        getWidget: vi.fn(() => meta),
      },
    } as unknown as DesignerEngine,
    schema: computed(() => schema),
    componentMap: {
      'floating-button': defineComponent({
        setup() {
          return () => h('button', { class: 'widget-root' }, 'fab')
        },
      }),
    },
    extensions: {},
    eventHooks: {},
    actionInterceptors: [],
    actionRegistry: {
      getActions: vi.fn(() => []),
      register: vi.fn(),
      unregister: vi.fn(),
      resolve: vi.fn(() => []),
    } as unknown as NodeActionRegistry,
    dragOverNodeId: ref(null),
  } as unknown as RendererContext
}

describe('widgetRenderer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('routes a selected root-owned viewport node into the registered root projection plane', async () => {
    const meta = makeMeta()
    const ctx = makeContext(meta)
    const selectionPresentation = createNodeSelectionPresentation()
    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const host = document.createElement('div')
    const plane = document.createElement('div')
    plane.className = 'test-root-selection-plane'
    selectionPresentation.registerPlane('root', plane)
    document.body.append(host, plane)

    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this instanceof HTMLElement && this.classList.contains('dc-node')) {
        return {
          top: 10,
          right: 123,
          bottom: 60,
          left: 23,
          width: 100,
          height: 50,
          x: 10,
          y: 10,
          toJSON: () => ({}),
        } as DOMRect
      }
      if (this instanceof HTMLElement && this.classList.contains('test-root-selection-plane')) {
        return {
          top: 0,
          right: 395,
          bottom: 500,
          left: 20,
          width: 375,
          height: 500,
          x: 20,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }

    ctx.engine.store.hoverNode('fab')

    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        provide(NODE_SELECTION_PRESENTATION_KEY, selectionPresentation)
        return () => h(WidgetRenderer, { node, selectionPlane: 'viewport' })
      },
    }))

    try {
      app.mount(host)
      await nextTick()
      expect(document.querySelector('.dc-node__selection-projection')).toBeNull()

      ctx.engine.store.selectNode('fab')
      await nextTick()
      await vi.waitFor(() => {
        expect(plane.querySelector('.dc-node__selection-projection--root-segment')).not.toBeNull()
      })

      const selection = plane.querySelector<HTMLElement>('.dc-node__selection-projection--root-segment')
      expect(selection?.style.top).toBe('10px')
      expect(selection?.style.left).toBe('0px')
      expect(selection?.style.width).toBe('375px')
      expect(selection?.style.height).toBe('50px')
      expect(selection?.querySelector('.dc-node__selection-outline')).not.toBeNull()
      expect(selection?.querySelectorAll('.dc-node__selection-edge')).toHaveLength(4)
      expect(document.querySelector('.dc-node__block-overlay')).toBeNull()
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      app.unmount()
      host.remove()
    }
  })

  it('keeps projection geometry outside a custom selection presenter', async () => {
    const meta = makeMeta()
    const ctx = makeContext(meta)
    const selectionPresentation = createNodeSelectionPresentation()
    const plane = document.createElement('div')
    const host = document.createElement('div')
    plane.className = 'test-selection-plane'
    plane.getBoundingClientRect = () => ({
      top: 100,
      right: 400,
      bottom: 500,
      left: 100,
      width: 300,
      height: 400,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect
    selectionPresentation.registerPlane('content', plane)
    document.body.append(host, plane)
    ctx.engine.store.selectNode('fab')

    let observedOwner: NodeOwner | null = null
    let observedKind: string | null = null
    ctx.extensions.nodeSelection = defineComponent({
      props: { owner: Object, projection: Object },
      setup(props) {
        observedOwner = props.owner as NodeOwner
        observedKind = (props.projection as { kind: string }).kind
        return () => h('div', { class: 'custom-selection-presenter' })
      },
    })

    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this instanceof HTMLElement && this.classList.contains('dc-node')) {
        return {
          top: 120,
          right: 310,
          bottom: 180,
          left: 150,
          width: 160,
          height: 60,
          x: 150,
          y: 120,
          toJSON: () => ({}),
        } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }

    const owner = { kind: 'container' as const, containerId: 'layout', regionId: 'left' }
    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        provide(NODE_SELECTION_PRESENTATION_KEY, selectionPresentation)
        return () => h(WidgetRenderer, {
          node: { id: 'fab', type: 'floating-button', props: {} },
          owner,
        })
      },
    }))

    try {
      app.mount(host)
      await nextTick()
      await vi.waitFor(() => {
        expect(plane.querySelector('.custom-selection-presenter')).not.toBeNull()
      })

      const projection = plane.querySelector<HTMLElement>('.dc-node__selection-projection')
      expect(projection?.style.cssText).toContain('top: 20px')
      expect(projection?.style.cssText).toContain('left: 50px')
      expect(observedOwner).toEqual(owner)
      expect(observedKind).toBe('material-bounds')
      expect(plane.querySelector('.dc-node__selection-outline')).toBeNull()
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      app.unmount()
    }
  })

  it('keeps self-positioned layer empty space transparent to canvas events', async () => {
    const meta = makeMeta({
      defaultLayout: {
        placement: {
          kind: 'layer',
          layer: 'float',
          mode: 'self',
        },
      },
    })
    const ctx = makeContext(meta)
    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        return () => h(WidgetRenderer, { node })
      },
    }))

    try {
      app.mount(host)
      await nextTick()

      const button = host.querySelector<HTMLElement>('.widget-root')
      expect(host.querySelector('.dc-node__mask')).toBeNull()
      expect(host.querySelector('.dc-node__handle')).toBeNull()
      expect(button?.hasAttribute('data-dc-node-surface')).toBe(true)
      expect(button?.getAttribute('style') ?? '').not.toContain('pointer-events: none')
      const nodeWrapper = host.querySelector<HTMLElement>('[data-dc-component="node"]')
      expect(nodeWrapper?.getAttribute('data-dc-state')).toContain('root-owned')

      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(ctx.engine.store.selectNode).toHaveBeenCalledWith('fab')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('teleports selected node toolbar into the owning canvas interaction layer', async () => {
    const meta = makeMeta({ mask: false })
    const ctx = makeContext(meta)
    ctx.engine.store.selectNode('fab')
    const resolvedActions: ResolvedNodeAction[] = [{
      key: 'delete',
      label: 'Delete',
      type: 'button',
      order: 100,
      risk: 'destructive',
      visible: true,
      disabled: false,
      handler: vi.fn(),
    }]
    ctx.actionRegistry = {
      getActions: vi.fn(() => []),
      register: vi.fn(),
      unregister: vi.fn(),
      resolve: vi.fn(() => resolvedActions),
    }

    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const canvas = document.createElement('div')
    canvas.className = 'dc-canvas'
    const host = document.createElement('div')
    const portal = document.createElement('div')
    portal.setAttribute('data-dc-canvas-interaction-layer', '')
    canvas.append(host, portal)
    document.body.append(canvas)

    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this instanceof HTMLElement && this.classList.contains('dc-node')) {
        return {
          top: 10,
          right: 110,
          bottom: 60,
          left: 10,
          width: 100,
          height: 50,
          x: 10,
          y: 10,
          toJSON: () => ({}),
        } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }

    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        return () => h(WidgetRenderer, { node })
      },
    }))

    try {
      app.mount(host)
      await nextTick()
      await new Promise(resolve => requestAnimationFrame(resolve))

      const toolbar = portal.querySelector<HTMLElement>('[data-dc-component="node-toolbar"]')
      expect(toolbar).not.toBeNull()
      expect(toolbar?.querySelector('[data-dc-part="action"][data-dc-state="danger"]')).not.toBeNull()
      expect(host.querySelector('.dc-node__toolbar')).toBeNull()
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      app.unmount()
      canvas.remove()
    }
  })

  it('uses node-box geometry and a horizontal top-end toolbar for container-owned nodes', async () => {
    const meta = makeMeta({ mask: false })
    const ctx = makeContext(meta)
    const selectionPresentation = createNodeSelectionPresentation()
    ctx.engine.store.selectNode('fab')
    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const host = document.createElement('div')
    const plane = document.createElement('div')
    plane.className = 'test-selection-plane'
    selectionPresentation.registerPlane('content', plane)
    document.body.append(host, plane)

    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this instanceof HTMLElement && this.classList.contains('dc-node')) {
        return {
          top: 120,
          right: 310,
          bottom: 180,
          left: 150,
          width: 160,
          height: 60,
          x: 150,
          y: 120,
          toJSON: () => ({}),
        } as DOMRect
      }
      if (this instanceof HTMLElement && this.classList.contains('dc-node__toolbar-anchor')) {
        return {
          top: 0,
          right: 100,
          bottom: 34,
          left: 0,
          width: 100,
          height: 34,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect
      }
      if (this instanceof HTMLElement && this.classList.contains('test-selection-plane')) {
        return {
          top: 100,
          right: 400,
          bottom: 500,
          left: 100,
          width: 300,
          height: 400,
          x: 100,
          y: 100,
          toJSON: () => ({}),
        } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }

    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        provide(NODE_SELECTION_PRESENTATION_KEY, selectionPresentation)
        return () => h(WidgetRenderer, {
          node,
          owner: { kind: 'container', containerId: 'layout', regionId: 'left' },
        })
      },
    }))

    try {
      app.mount(host)
      await nextTick()
      await nextTick()

      const overlay = plane.querySelector<HTMLElement>('.dc-node__selection-projection--container-owned')
      expect(overlay?.style.top).toBe('20px')
      expect(overlay?.style.left).toBe('50px')
      expect(overlay?.style.width).toBe('160px')
      expect(overlay?.style.height).toBe('60px')
      const toolbar = document.querySelector<HTMLElement>('.dc-node__toolbar--horizontal')
      expect(toolbar?.dataset.placement).toBe('top-end')
      expect(toolbar?.getAttribute('data-dc-component')).toBe('node-toolbar')
      expect(toolbar?.getAttribute('data-dc-state')).toContain('horizontal')
      expect(host.querySelector('.dc-node__handle')).toBeNull()
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      app.unmount()
      host.remove()
    }
  })

  it('passes the structural owner to interaction extension components', async () => {
    const meta = makeMeta({ mask: true })
    const ctx = makeContext(meta)
    const owner = { kind: 'container' as const, containerId: 'layout', regionId: 'left' }
    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const observed = {
      mask: null as NodeOwner | null,
      toolbar: null as NodeOwner | null,
      wrapper: null as NodeOwner | null,
    }
    ctx.extensions = {
      nodeMask: defineComponent({
        props: { owner: Object },
        setup(props) {
          observed.mask = props.owner as NodeOwner
          return () => h('div', { class: 'custom-mask' })
        },
      }),
      nodeToolbar: defineComponent({
        props: { owner: Object },
        setup(props) {
          observed.toolbar = props.owner as NodeOwner
          return () => h('div', { class: 'custom-toolbar' })
        },
      }),
      nodeWrapper: defineComponent({
        props: { owner: Object },
        setup(props, { slots }) {
          observed.wrapper = props.owner as NodeOwner
          return () => h('div', { class: 'custom-wrapper' }, slots.default?.())
        },
      }),
    }
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        return () => h(WidgetRenderer, { node, owner })
      },
    }))

    try {
      app.mount(host)
      expect(observed.mask).toEqual(owner)
      expect(observed.wrapper).toEqual(owner)

      ctx.engine.store.selectNode('fab')
      await nextTick()
      expect(observed.toolbar).toEqual(owner)
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('applies container styles to the node box and content styles to the widget', async () => {
    const meta = makeMeta({ mask: false })
    const ctx = makeContext(meta)
    const node: SchemaNode = {
      id: 'fab',
      type: 'floating-button',
      props: {},
      style: {
        container: { marginTop: -20 },
        content: { color: 'red' },
      },
    }
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        return () => h(WidgetRenderer, { node })
      },
    }))

    try {
      app.mount(host)
      await nextTick()

      expect(host.querySelector<HTMLElement>('.dc-node')?.style.marginTop).toBe('-20px')
      expect(host.querySelector<HTMLElement>('.widget-root')?.style.color).toBe('red')
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('provides a command-backed widget runtime to rendered widgets', async () => {
    const meta = makeMeta({ mask: false })
    const RuntimeWidget = defineComponent({
      setup() {
        const runtime = useWidgetRuntime()
        return () => h('button', {
          class: 'runtime-widget',
          onClick: () => runtime.updateContainerStyle({ marginTop: -20 }),
        }, 'update')
      },
    })
    const ctx = makeContext(meta)
    ctx.componentMap['floating-button'] = RuntimeWidget
    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        return () => h(WidgetRenderer, { node })
      },
    }))

    try {
      app.mount(host)
      await nextTick()

      host.querySelector<HTMLElement>('.runtime-widget')?.click()
      expect(ctx.engine.execute).toHaveBeenCalledWith({
        type: CommandType.UPDATE_PROPS,
        payload: {
          nodeId: 'fab',
          props: {},
          style: { container: { marginTop: -20 } },
        },
      })
    }
    finally {
      app.unmount()
      host.remove()
    }
  })

  it('renders a resolved external container without a blocking mask or page attributes on its children', () => {
    const child: SchemaNode = {
      id: 'preserved-child',
      type: 'text',
      props: {},
    }
    const engine = createEngineWithContainer([child])
    const ExternalContainer = defineComponent({
      setup() {
        return () => h('div', { class: 'external-container' }, [
          h(ContainerRegionOutlet, { regionId: 'left' }),
          h(ContainerRegionOutlet, { regionId: 'right' }),
        ])
      },
    })
    const { app, host } = mountRoot(engine, {
      'split-layout': ExternalContainer,
      'text': defineComponent({ setup: () => () => h('span', 'child') }),
    })

    try {
      expect(host.querySelectorAll('[data-node-id="preserved-child"]')).toHaveLength(1)
      expect(host.querySelector('[data-node-id="layout"] .dc-node__mask')).toBeNull()
      const childWrapper = host.querySelector<HTMLElement>('[data-node-id="preserved-child"]')
      expect(childWrapper?.hasAttribute('data-dc-layout-placement')).toBe(false)
      expect(childWrapper?.hasAttribute('data-dc-layer-mode')).toBe(false)
      expect(childWrapper?.hasAttribute('data-dc-layout-region')).toBe(false)
      expect(childWrapper?.hasAttribute('data-dc-sort-scope')).toBe(false)
      expect(childWrapper?.hasAttribute('data-dc-page-order')).toBe(false)
    }
    finally {
      app.unmount()
    }
  })

  it('keeps the container handle outside the Frame without material hover state', async () => {
    const engine = createEngineWithContainer([])
    const ExternalContainer = defineComponent({
      setup() {
        return () => h('div', { class: 'external-container' }, [
          h(ContainerRegionOutlet, { regionId: 'left' }),
        ])
      },
    })
    const canvas = document.createElement('div')
    canvas.className = 'dc-canvas'
    const frame = document.createElement('div')
    frame.setAttribute('data-dc-toolbar-boundary', '')
    const host = document.createElement('div')
    const interactionLayer = document.createElement('div')
    interactionLayer.setAttribute('data-dc-canvas-interaction-layer', '')
    frame.appendChild(host)
    canvas.append(frame, interactionLayer)
    document.body.appendChild(canvas)
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this instanceof HTMLElement && this.dataset.nodeId === 'layout') {
        return {
          top: 100,
          right: 500,
          bottom: 300,
          left: 200,
          width: 300,
          height: 200,
          x: 200,
          y: 100,
          toJSON: () => ({}),
        } as DOMRect
      }
      if (this instanceof HTMLElement && this.hasAttribute('data-dc-toolbar-boundary')) {
        return {
          top: 40,
          right: 480,
          bottom: 640,
          left: 80,
          width: 400,
          height: 600,
          x: 80,
          y: 40,
          toJSON: () => ({}),
        } as DOMRect
      }
      if (this instanceof HTMLElement && this.classList.contains('dc-node__handle-anchor')) {
        return {
          top: 0,
          right: 32,
          bottom: 32,
          left: 0,
          width: 32,
          height: 32,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }
    const app = createApp(defineComponent({
      setup() {
        return () => h(RootRenderer, {
          engine,
          componentMap: { 'split-layout': ExternalContainer },
        })
      },
    }))

    try {
      app.mount(host)
      await nextTick()

      await vi.waitFor(() => {
        expect(interactionLayer.querySelector('.dc-node__handle-anchor--visible')).not.toBeNull()
      })
      const wrapper = host.querySelector<HTMLElement>('[data-node-id="layout"]')!
      const anchor = interactionLayer.querySelector<HTMLElement>('.dc-node__handle-anchor')!
      const button = anchor.querySelector<HTMLButtonElement>('.dc-node__handle')!
      expect(wrapper.querySelector(':scope > .dc-node__handle')).toBeNull()
      expect(anchor.dataset.dcNodeHandleFor).toBe('layout')
      expect(anchor.style.transform).toBe('translate3d(40px, 100px, 0)')

      wrapper.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      expect(engine.store.hoveredNodeId.value).toBeNull()

      button.click()
      await nextTick()
      expect(engine.store.selectedNodeId.value).toBe('layout')
      expect(interactionLayer.querySelector('.dc-node__handle-anchor')).toBeNull()
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      app.unmount()
      canvas.remove()
    }
  })

  it('inherits the viewport selection plane through a root layer container subtree', async () => {
    const child: SchemaNode = { id: 'layer-child', type: 'text', props: {} }
    const engine = createEngineWithContainer(
      [child],
      true,
      {},
      { placement: { kind: 'layer', layer: 'float', mode: 'framework' } },
    )
    const ExternalContainer = defineComponent({
      setup() {
        return () => h('div', { class: 'external-container' }, [
          h(ContainerRegionOutlet, { regionId: 'left' }),
        ])
      },
    })
    const TestShell = defineComponent({
      props: {
        layerVNodes: { type: Object, default: () => ({}) },
        selectionPresentation: { type: Object, required: true },
      },
      setup(props) {
        const presentation = props.selectionPresentation as NodeSelectionPresentationHost
        return () => h('div', { class: 'test-shell' }, [
          h('div', {
            ref: (element: unknown) => {
              presentation.registerPlane('content', element instanceof HTMLElement ? element : null)
            },
            class: 'test-content-plane',
          }),
          h('div', {
            ref: (element: unknown) => {
              presentation.registerPlane('viewport', element instanceof HTMLElement ? element : null)
            },
            class: 'test-viewport-plane',
          }, Object.values(props.layerVNodes as Record<string, VNode[]>).flat()),
        ])
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this instanceof HTMLElement && this.classList.contains('test-content-plane')) {
        return { top: 0, right: 375, bottom: 600, left: 0, width: 375, height: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
      }
      if (this instanceof HTMLElement && this.classList.contains('test-viewport-plane')) {
        return { top: 0, right: 375, bottom: 600, left: 0, width: 375, height: 600, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
      }
      if (this instanceof HTMLElement && this.dataset.nodeId === 'layer-child') {
        return { top: 80, right: 240, bottom: 140, left: 120, width: 120, height: 60, x: 120, y: 80, toJSON: () => ({}) } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }
    const app = createApp(defineComponent({
      setup() {
        return () => h(RootRenderer, {
          engine,
          componentMap: {
            'split-layout': ExternalContainer,
            'text': defineComponent({ setup: () => () => h('span', 'child') }),
          },
          extensions: { containerShell: TestShell },
        })
      },
    }))

    try {
      app.mount(host)
      engine.store.selectNode('layer-child')
      await nextTick()
      await vi.waitFor(() => {
        expect(host.querySelector('.test-viewport-plane .dc-node__selection-projection--container-owned')).not.toBeNull()
      })
      expect(host.querySelector('.test-content-plane .dc-node__selection-projection')).toBeNull()
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      app.unmount()
    }
  })

  it('renders unresolved persisted children in a recovery fallback exactly once', () => {
    const preservedChild: SchemaNode = { id: 'preserved-child', type: 'text', props: {} }
    const engine = createEngineWithContainer([preservedChild], false)
    const { app, host } = mountRoot(engine, {
      text: defineComponent({ setup: () => () => h('span', 'preserved') }),
    })

    try {
      expect(host.querySelector('[data-dc-unresolved-container="layout"]')).not.toBeNull()
      expect(host.querySelectorAll('[data-node-id="preserved-child"]')).toHaveLength(1)
      expect(host.querySelector('[data-dc-container-region="left"]')).not.toBeNull()
    }
    finally {
      app.unmount()
    }
  })

  it('recovers every persisted child when a valid container has no external material', () => {
    const leftChild: SchemaNode = { id: 'left-child', type: 'text', props: {} }
    const rightChild: SchemaNode = { id: 'right-child', type: 'text', props: {} }
    const engine = createEngineWithContainer([leftChild], true, { right: [rightChild] })
    const { app, host } = mountRoot(engine, {
      text: defineComponent({ setup: () => () => h('span', 'preserved') }),
    })

    try {
      expect(host.querySelector('[data-dc-unresolved-container="layout"]')).not.toBeNull()
      expect(host.querySelectorAll('[data-node-id="left-child"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-node-id="right-child"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
    }
  })

  it('recovers the whole container when persisted regions exceed the active variant', () => {
    const leftChild: SchemaNode = { id: 'left-child', type: 'text', props: {} }
    const rightChild: SchemaNode = { id: 'right-child', type: 'text', props: {} }
    const legacyChild: SchemaNode = { id: 'legacy-child', type: 'text', props: {} }
    const engine = createEngineWithContainer([leftChild], true, {
      right: [rightChild],
      legacy: [legacyChild],
    })
    const ExternalContainer = defineComponent({
      setup() {
        return () => h('div', { class: 'external-container' }, [
          h(ContainerRegionOutlet, { regionId: 'left' }),
          h(ContainerRegionOutlet, { regionId: 'right' }),
        ])
      },
    })
    const { app, host } = mountRoot(engine, {
      'split-layout': ExternalContainer,
      'text': defineComponent({ setup: () => () => h('span', 'preserved') }),
    })

    try {
      expect(host.querySelector('[data-dc-unresolved-container="layout"]')).not.toBeNull()
      expect(host.querySelector('.external-container')).toBeNull()
      expect(host.querySelectorAll('[data-node-id="left-child"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-node-id="right-child"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-node-id="legacy-child"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
    }
  })
})

function createEngineWithContainer(
  left: SchemaNode[],
  registerContainer = true,
  otherRegions: Record<string, SchemaNode[]> = {},
  layout?: SchemaNode['layout'],
) {
  const engine = createEngine()
  engine.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'content',
    defaultProps: {},
    formSchema: { sections: [] },
    mask: false,
  })
  const imported = engine.importSchema({
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [{
        id: 'layout',
        type: 'split-layout',
        props: {},
        layout,
        container: { variant: 'split', regions: { left, right: [], ...otherRegions } },
      }],
    },
  })
  if (!imported.ok)
    throw new Error(`Test schema rejected: ${imported.diagnostics.map(item => item.code).join(', ')}`)
  if (registerContainer) {
    engine.registerWidget({
      type: 'split-layout',
      title: 'Split layout',
      group: 'layout',
      defaultProps: {},
      formSchema: { sections: [] },
      container: {
        defaultVariant: 'split',
        variants: {
          split: {
            title: 'Split',
            regions: [
              { id: 'left', title: 'Left' },
              { id: 'right', title: 'Right' },
            ],
          },
        },
      },
    })
  }
  return engine
}

function mountRoot(engine: DesignerEngine, componentMap: Record<string, Component>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent({
    setup() {
      return () => h(RootRenderer, { engine, componentMap })
    },
  }))
  app.mount(host)
  return { app, host }
}
