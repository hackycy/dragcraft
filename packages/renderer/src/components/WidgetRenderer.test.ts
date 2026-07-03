// @vitest-environment happy-dom
import type { DesignerEngine, SchemaNode, WidgetMeta } from '@dragcraft/core'
import type { RendererContext } from '../types'
import { describe, expect, it, vi } from 'vitest'
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
    actionRegistry: undefined,
    dragOverNodeId: ref(null),
  } as unknown as RendererContext
}

describe('widgetRenderer', () => {
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
})
