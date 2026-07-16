// @vitest-environment happy-dom
import type { NodeDestination, PlacementDecision, SchemaNode } from '@dragcraft/core'
import type { Component, Ref } from 'vue'
import type { RendererWidgetMeta, ResolveContainerDropIndex } from '../types'
import { CommandType, createEngine } from '@dragcraft/core'
import { createI18n, I18N_KEY } from '@dragcraft/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { rendererMessages } from '../messages'
import ContainerRegionOutlet from './ContainerRegionOutlet'
import RootRenderer from './RootRenderer'

interface MountOptions {
  nodes?: SchemaNode[]
  resolveDropIndex?: ResolveContainerDropIndex
  registeredResolveDropIndex?: ResolveContainerDropIndex
  activeDestination?: Ref<NodeDestination | null>
  containerDropDecision?: Ref<PlacementDecision | null>
  onContainerDragOver?: (...args: any[]) => void
  onContainerDragLeave?: (...args: any[]) => void
  onContainerDrop?: (...args: any[]) => void
  extensions?: Record<string, Component>
}

function makeNode(id: string): SchemaNode {
  return { id, type: 'text', props: { text: id } }
}

function mountExternalSplit(options: MountOptions = {}) {
  const nodes = options.nodes ?? [makeNode('left-child')]
  const right = makeNode('right-child')
  const onContainerDragOver = options.onContainerDragOver ?? vi.fn()
  const onContainerDragLeave = options.onContainerDragLeave ?? vi.fn()
  const onContainerDrop = options.onContainerDrop ?? vi.fn()
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
          container: { variant: 'split', regions: { left: nodes, right: [right] } },
        }],
      },
    },
  })
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
            { id: 'left', title: 'Left region' },
            { id: 'right', title: 'Right region' },
          ],
        },
      },
    },
    containerAdapter: options.registeredResolveDropIndex
      ? { resolveDropIndex: options.registeredResolveDropIndex }
      : undefined,
  } as RendererWidgetMeta)
  engine.registerWidget({
    type: 'text',
    title: 'Text',
    group: 'content',
    defaultProps: {},
    formSchema: { sections: [] },
    mask: false,
  })

  const SplitMaterial = defineComponent({
    setup() {
      return () => h('section', { class: 'external-split' }, [
        h(ContainerRegionOutlet, {
          'regionId': 'left',
          'resolveDropIndex': options.resolveDropIndex,
          'class': 'material-left',
          'style': { minHeight: '24px' },
          'aria-label': 'Custom left region',
        }),
        h(ContainerRegionOutlet, { regionId: 'right', as: 'aside' }),
      ])
    },
  })
  const TextMaterial = defineComponent({
    props: { text: String },
    setup(props) {
      return () => h('p', { class: 'text-material' }, props.text)
    },
  })
  const componentMap: Record<string, Component> = {
    'split-layout': SplitMaterial,
    'text': TextMaterial,
  }
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(defineComponent({
    setup() {
      provide(I18N_KEY, createI18n('zh-CN', rendererMessages))
      return () => h(RootRenderer, {
        engine,
        componentMap,
        extensions: options.extensions,
        activeDestination: options.activeDestination,
        containerDropDecision: options.containerDropDecision,
        onContainerDragOver,
        onContainerDragLeave,
        onContainerDrop,
      })
    },
  }))
  app.mount(host)
  const region = host.querySelector<HTMLElement>('[data-dc-container-region="left"]')!
  return {
    app,
    engine,
    host,
    region,
    onContainerDragOver,
    onContainerDragLeave,
    onContainerDrop,
  }
}

describe('containerRegionOutlet', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders each nested widget exactly once through its owner outlet', async () => {
    const { app, host } = mountExternalSplit()
    try {
      await nextTick()

      expect(host.querySelectorAll('[data-node-id="left-child"]')).toHaveLength(1)
      expect(host.querySelectorAll('[data-node-id="right-child"]')).toHaveLength(1)
      expect(host.querySelector('[data-node-id="layout"]')?.getAttribute('data-dc-node-owner')).toBe('root')
      expect(host.querySelector('[data-node-id="left-child"]')?.getAttribute('data-dc-node-owner')).toBe('container')
      expect(host.querySelector('[data-node-id="left-child"]')?.classList).toContain('dc-node--container-owned')
      expect(host.querySelector('[data-dc-container-region="left"]')).not.toBeNull()
      expect(host.querySelector('[data-dc-container-region="right"]')?.tagName).toBe('ASIDE')
    }
    finally {
      app.unmount()
    }
  })

  it('selects a container from blank material space without stealing child content clicks', async () => {
    const { app, engine, host } = mountExternalSplit()
    try {
      const containerSurface = host.querySelector<HTMLElement>('.external-split')!
      const childContent = host.querySelector<HTMLElement>('[data-node-id="left-child"] .text-material')!
      const childHandle = host.querySelector<HTMLElement>('[data-node-id="left-child"] .dc-node__handle')!

      containerSurface.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(engine.store.selectedNodeId.value).toBe('layout')

      engine.store.selectNode(null)
      childContent.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(engine.store.selectedNodeId.value).toBeNull()

      childHandle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(engine.store.selectedNodeId.value).toBe('left-child')
      await nextTick()
      expect(host.querySelector('[data-node-id="left-child"] .dc-node__handle')).toBeNull()
    }
    finally {
      app.unmount()
    }
  })

  it('gives hover to the deepest node without publishing container material hover', () => {
    const { app, engine, host } = mountExternalSplit()
    try {
      const childWrapper = host.querySelector<HTMLElement>('[data-node-id="left-child"]')!
      const childContent = childWrapper.querySelector<HTMLElement>('.text-material')!
      const containerSurface = host.querySelector<HTMLElement>('.external-split')!

      childContent.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      expect(engine.store.hoveredNodeId.value).toBe('left-child')

      childWrapper.dispatchEvent(new MouseEvent('mouseleave'))
      containerSurface.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      expect(engine.store.hoveredNodeId.value).toBeNull()
    }
    finally {
      app.unmount()
    }
  })

  it('reacts when ADD_NODE inserts a widget into its region', async () => {
    const { app, engine, host } = mountExternalSplit({ nodes: [] })
    try {
      expect(host.querySelectorAll('[data-node-id="added-child"]')).toHaveLength(0)

      const result = engine.execute({
        type: CommandType.ADD_NODE,
        payload: {
          node: makeNode('added-child'),
          destination: {
            kind: 'container',
            containerId: 'layout',
            regionId: 'left',
          },
        },
      })
      expect(result.ok).toBe(true)

      await nextTick()

      expect(host.querySelectorAll('[data-node-id="added-child"]')).toHaveLength(1)
    }
    finally {
      app.unmount()
    }
  })

  it('keeps selection while a node moves from a container region to root presentation', async () => {
    const { app, engine, host } = mountExternalSplit()
    try {
      engine.store.selectNode('left-child')
      const result = engine.execute({
        type: CommandType.MOVE_NODE,
        payload: {
          nodeId: 'left-child',
          destination: { kind: 'root', index: 1 },
        },
      })
      expect(result.ok).toBe(true)
      expect(engine.store.selectedNodeId.value).toBe('left-child')

      await nextTick()

      const moved = host.querySelector<HTMLElement>('[data-node-id="left-child"]')
      expect(moved?.getAttribute('data-dc-node-owner')).toBe('root')
      expect(moved?.classList).toContain('dc-node--root-owned')
    }
    finally {
      app.unmount()
    }
  })

  it('forwards material-owned DOM attributes without adding layout styles', () => {
    const { app, region } = mountExternalSplit()
    try {
      expect(region.classList.contains('dc-container-region')).toBe(true)
      expect(region.classList.contains('material-left')).toBe(true)
      expect(region.style.minHeight).toBe('24px')
      expect(region.getAttribute('data-dc-container-id')).toBe('layout')
      expect(region.getAttribute('role')).toBe('group')
      expect(region.getAttribute('aria-label')).toBe('Custom left region')
      expect(region.style.display).toBe('')
      expect(region.style.flexDirection).toBe('')
      expect(region.style.gridTemplateColumns).toBe('')
      expect(region.style.gap).toBe('')
      expect(region.style.width).toBe('')
      expect(region.style.height).toBe('')
    }
    finally {
      app.unmount()
    }
  })

  it('uses the outlet resolver and publishes the resulting destination', () => {
    const registeredResolveDropIndex = vi.fn(() => 0)
    const resolveDropIndex = vi.fn<ResolveContainerDropIndex>(() => 1)
    const { app, region, onContainerDragOver } = mountExternalSplit({
      registeredResolveDropIndex,
      resolveDropIndex,
    })
    try {
      const event = new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: 20, clientY: 30 })
      region.dispatchEvent(event)

      expect(resolveDropIndex).toHaveBeenCalledWith(expect.objectContaining({
        event,
        regionElement: region,
        itemElements: expect.any(Array),
        nodes: expect.any(Array),
      }))
      expect(resolveDropIndex.mock.calls[0]![0].itemElements).toHaveLength(1)
      expect(registeredResolveDropIndex).not.toHaveBeenCalled()
      expect(onContainerDragOver).toHaveBeenCalledWith({
        event,
        destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 1 },
      })
      expect(event.defaultPrevented).toBe(true)
    }
    finally {
      app.unmount()
    }
  })

  it('uses the registered widget adapter when the outlet has no override', () => {
    const registeredResolveDropIndex = vi.fn(() => 0)
    const { app, region, onContainerDragOver } = mountExternalSplit({ registeredResolveDropIndex })
    try {
      const event = new DragEvent('dragover', { bubbles: true, cancelable: true })
      region.dispatchEvent(event)

      expect(registeredResolveDropIndex).toHaveBeenCalledOnce()
      expect(onContainerDragOver).toHaveBeenCalledWith({
        event,
        destination: { kind: 'container', containerId: 'layout', regionId: 'left', index: 0 },
      })
    }
    finally {
      app.unmount()
    }
  })

  it('blocks drop when no resolver exists and does not guess append', () => {
    const { app, region, onContainerDragOver } = mountExternalSplit()
    try {
      const event = new DragEvent('dragover', { bubbles: true, cancelable: true })
      region.dispatchEvent(event)

      expect(onContainerDragOver).toHaveBeenCalledWith({
        event,
        containerId: 'layout',
        regionId: 'left',
        allowed: false,
        code: 'CONTAINER_DROP_ADAPTER_MISSING',
      })
    }
    finally {
      app.unmount()
    }
  })

  it.each([1.5, -1, 2])('rejects invalid material index %s', (index) => {
    const { app, region, onContainerDragOver } = mountExternalSplit({ resolveDropIndex: () => index })
    try {
      const event = new DragEvent('dragover', { bubbles: true, cancelable: true })
      region.dispatchEvent(event)

      expect(onContainerDragOver).toHaveBeenCalledWith({
        event,
        containerId: 'layout',
        regionId: 'left',
        allowed: false,
        code: 'CONTAINER_DROP_ADAPTER_INVALID',
      })
    }
    finally {
      app.unmount()
    }
  })

  it('reports a resolver failure without throwing from the DOM event', () => {
    const { app, region, onContainerDragOver } = mountExternalSplit({
      resolveDropIndex: () => { throw new Error('geometry unavailable') },
    })
    try {
      const event = new DragEvent('dragover', { bubbles: true, cancelable: true })
      expect(() => region.dispatchEvent(event)).not.toThrow()
      expect(onContainerDragOver).toHaveBeenCalledWith({
        event,
        containerId: 'layout',
        regionId: 'left',
        allowed: false,
        code: 'CONTAINER_DROP_ADAPTER_FAILED',
        message: 'geometry unavailable',
      })
    }
    finally {
      app.unmount()
    }
  })

  it('publishes an explicit no-target rejection when the material resolver returns null', () => {
    const { app, region, onContainerDragOver } = mountExternalSplit({ resolveDropIndex: () => null })
    try {
      const event = new DragEvent('dragover', { bubbles: true, cancelable: true })
      region.dispatchEvent(event)
      expect(onContainerDragOver).toHaveBeenCalledWith({
        event,
        containerId: 'layout',
        regionId: 'left',
        allowed: false,
        code: 'CONTAINER_DROP_NO_TARGET',
      })
    }
    finally {
      app.unmount()
    }
  })

  it('isolates nested region drag events from parent region callbacks', () => {
    const resolveDropIndex = vi.fn(() => 0)
    const {
      app,
      region,
      onContainerDragOver,
      onContainerDragLeave,
      onContainerDrop,
    } = mountExternalSplit({ resolveDropIndex })
    try {
      const nested = document.createElement('div')
      nested.dataset.dcContainerRegion = 'nested'
      region.appendChild(nested)
      nested.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }))
      nested.dispatchEvent(new DragEvent('dragleave', { bubbles: true }))
      nested.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }))

      expect(resolveDropIndex).not.toHaveBeenCalled()
      expect(onContainerDragOver).not.toHaveBeenCalled()
      expect(onContainerDragLeave).not.toHaveBeenCalled()
      expect(onContainerDrop).not.toHaveBeenCalled()
    }
    finally {
      app.unmount()
    }
  })

  it('forwards isolated dragleave and drop events to the renderer callbacks', () => {
    const { app, region, onContainerDragLeave, onContainerDrop } = mountExternalSplit()
    try {
      const dragleave = new DragEvent('dragleave', { bubbles: true })
      const drop = new DragEvent('drop', { bubbles: true, cancelable: true })
      region.dispatchEvent(dragleave)
      region.dispatchEvent(drop)

      expect(onContainerDragLeave).toHaveBeenCalledWith(dragleave)
      expect(onContainerDrop).toHaveBeenCalledWith(drop)
      expect(drop.defaultPrevented).toBe(true)
    }
    finally {
      app.unmount()
    }
  })

  it('renders empty, active, and forbidden region feedback without layout styles', () => {
    const activeDestination = ref<NodeDestination | null>({
      kind: 'container',
      containerId: 'layout',
      regionId: 'left',
      index: 0,
    })
    const containerDropDecision = ref<PlacementDecision | null>({
      allowed: false,
      code: 'CONTAINER_REGION_MAX_ITEMS',
      message: 'Region is full',
    })
    const EmptyState = defineComponent({ setup: () => () => h('i', { class: 'custom-empty' }) })
    const DropIndicator = defineComponent({ setup: () => () => h('i', { class: 'custom-indicator' }) })
    const Forbidden = defineComponent({ setup: () => () => h('i', { class: 'custom-forbidden' }) })
    const { app, region } = mountExternalSplit({
      nodes: [],
      activeDestination,
      containerDropDecision,
      extensions: { emptyState: EmptyState, dropIndicator: DropIndicator, forbiddenOverlay: Forbidden },
    })
    try {
      expect(region.classList).toContain('dc-container-region--empty')
      expect(region.classList).toContain('dc-container-region--active')
      expect(region.classList).toContain('dc-container-region--forbidden')
      expect(region.getAttribute('aria-disabled')).toBe('true')
      expect(region.querySelector('.custom-empty')).not.toBeNull()
      expect(region.querySelector('.custom-forbidden')).not.toBeNull()
      expect(region.querySelector('.custom-indicator')).toBeNull()
      expect(region.style.display).toBe('')
      expect(region.style.flexDirection).toBe('')
      expect(region.style.gridTemplateColumns).toBe('')
    }
    finally {
      app.unmount()
    }
  })

  it('renders active allowed feedback at the destination index', () => {
    const activeDestination = ref<NodeDestination | null>({
      kind: 'container',
      containerId: 'layout',
      regionId: 'left',
      index: 0,
    })
    const containerDropDecision = ref<PlacementDecision | null>({ allowed: true })
    const DropIndicator = defineComponent({ setup: () => () => h('i', { class: 'custom-indicator' }) })
    const { app, region } = mountExternalSplit({
      activeDestination,
      containerDropDecision,
      extensions: { dropIndicator: DropIndicator },
    })
    try {
      expect(region.classList).toContain('dc-container-region--active')
      expect(region.classList).not.toContain('dc-container-region--forbidden')
      expect(region.firstElementChild?.classList).toContain('custom-indicator')
    }
    finally {
      app.unmount()
    }
  })
})
