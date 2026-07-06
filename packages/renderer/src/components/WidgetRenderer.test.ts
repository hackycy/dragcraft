// @vitest-environment happy-dom
import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { NodeActionRegistry, ResolvedNodeAction } from '../action-registry'
import type { RendererContext } from '../types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { RENDERER_CONTEXT_KEY } from '../types'
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
  return {
    engine: {
      store: {
        schema: ref({
          version: '1.0.0',
          globalConfig: {},
          root: { id: 'root', type: 'root', props: {}, children: [] },
        }),
        selectedNodeId: ref(null),
        hoveredNodeId: ref(null),
        dragTarget: ref(null),
        getRawSchema: () => ({
          version: '1.0.0',
          globalConfig: {},
          root: { id: 'root', type: 'root', props: {}, children: [] },
        }),
        selectNode,
        hoverNode: vi.fn(),
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

  it('teleports selected node toolbar into the designer portal when available', async () => {
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
    const host = document.createElement('div')
    const portal = document.createElement('div')
    portal.setAttribute('data-dc-designer-portal', '')
    document.body.append(host, portal)

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
      host.remove()
      portal.remove()
    }
  })
})
