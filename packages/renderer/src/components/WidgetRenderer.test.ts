import type { DesignerEngine, DesignerSchema, NodeOwner, SchemaNode, WidgetMeta } from '@dragcraft/core'
// @vitest-environment happy-dom
import type { Component } from 'vue'
import type { NodeActionRegistry, ResolvedNodeAction } from '../action-registry'
import type { RendererContext } from '../types'
import { CommandType, createEngine } from '@dragcraft/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
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
  const selectNode = vi.fn()
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
        selectedNodeId: ref(null),
        hoveredNodeId: ref(null),
        dragTarget: ref(null),
        getRawSchema: () => schema,
        selectNode,
        hoverNode: vi.fn(),
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

  it('owns the hover and selected outline styles at runtime', async () => {
    const meta = makeMeta()
    const ctx = makeContext(meta)
    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const host = document.createElement('div')
    document.body.appendChild(host)

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

    ctx.engine.store.hoveredNodeId.value = 'fab'

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

      const hoveredOverlay = document.querySelector<HTMLElement>('.dc-node__block-overlay--hovered')
      expect(hoveredOverlay?.style.outlineStyle).toBe('dashed')

      ctx.engine.store.selectedNodeId.value = 'fab'
      await nextTick()

      const selectedOverlay = document.querySelector<HTMLElement>('.dc-node__block-overlay--selected')
      expect(selectedOverlay?.style.outlineStyle).toBe('solid')
      expect(document.querySelector('.dc-node__block-overlay--hovered')).toBeNull()
    }
    finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      app.unmount()
      host.remove()
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
    ctx.engine.store.selectedNodeId.value = 'fab'
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

      expect(portal.querySelector('.dc-node__toolbar')).not.toBeNull()
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
    ctx.engine.store.selectedNodeId.value = 'fab'
    const node: SchemaNode = { id: 'fab', type: 'floating-button', props: {} }
    const host = document.createElement('div')
    document.body.appendChild(host)

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
      return originalGetBoundingClientRect.call(this)
    }

    const app = createApp(defineComponent({
      setup() {
        provide(RENDERER_CONTEXT_KEY, ctx)
        return () => h(WidgetRenderer, {
          node,
          owner: { kind: 'container', containerId: 'layout', regionId: 'left' },
        })
      },
    }))

    try {
      app.mount(host)
      await nextTick()
      await new Promise(resolve => requestAnimationFrame(resolve))

      const overlay = document.querySelector<HTMLElement>('.dc-node__block-overlay--container-owned')
      expect(overlay?.style.left).toBe('151px')
      expect(overlay?.style.width).toBe('158px')
      const toolbar = document.querySelector<HTMLElement>('.dc-node__toolbar--horizontal')
      expect(toolbar?.dataset.placement).toBe('top-end')
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

      ctx.engine.store.selectedNodeId.value = 'fab'
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
      layout: { placement: { kind: 'layer', layer: 'float' }, order: 12 },
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
) {
  const engine = createEngine({
    initialSchema: {
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
          container: { variant: 'split', regions: { left, right: [], ...otherRegions } },
        }],
      },
    },
  })
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
  engine.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'content',
    defaultProps: {},
    formSchema: { sections: [] },
    mask: false,
  })
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
