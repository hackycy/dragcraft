// @vitest-environment happy-dom
import type { DesignerContext, DesignerInstance, DesignerWidgetMeta } from '..'
import { I18N_KEY } from '@dragcraft/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { createDesigner, DESIGNER_CONTEXT_KEY } from '..'
import DcMaterialItem from './DcMaterialItem'

function makeMeta(): DesignerWidgetMeta {
  return {
    type: 'button',
    title: 'Button',
    group: 'basic',
    icon: 'button',
    material: {
      title: 'Action Button',
      description: 'Trigger a primary action',
      tags: ['action'],
      keywords: ['cta'],
    },
    defaultProps: {},
    formSchema: { sections: [] },
  }
}

function makeContext(instance: DesignerInstance): DesignerContext {
  return {
    engine: instance.engine,
    componentMap: instance.componentMap,
    widgetGroups: instance.widgetGroups,
    extensions: instance.extensions,
    fieldComponentMap: instance.fieldComponentMap,
    globalConfigSchema: instance.globalConfigSchema,
    eventHooks: instance.eventHooks,
    actionInterceptors: instance.actionInterceptors,
    actionRegistry: instance.actionRegistry,
    dragOverNodeId: ref(null),
    dragOverIndex: ref(null),
    handleMaterialDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleCanvasDragOver: vi.fn(),
    handleCanvasDragLeave: vi.fn(),
    handleCanvasDrop: vi.fn(),
    isForbidden: ref(false),
    forbiddenReason: ref(null),
    searchQuery: ref(''),
    activeTab: ref('widget'),
    leftPanelActiveTab: ref('materials'),
  }
}

function mountItem(instance: DesignerInstance, meta: DesignerWidgetMeta) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const ctx = makeContext(instance)
  const app = createApp(defineComponent({
    setup() {
      provide(DESIGNER_CONTEXT_KEY, ctx)
      provide(I18N_KEY, instance.i18n)
      return () => h(DcMaterialItem, { meta })
    },
  }))
  app.mount(host)
  return { app, host, ctx }
}

describe('dcMaterialItem', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders compact material display metadata in the default card', async () => {
    const meta = makeMeta()
    const designer = createDesigner({ widgetMetas: [meta] })
    const { app, host } = mountItem(designer, meta)

    try {
      await nextTick()

      expect(host.querySelector('.dc-material-item__title')?.textContent).toBe('Action Button')
      expect(host.querySelector('.dc-material-item')?.getAttribute('title')).toBe('Action Button: Trigger a primary action')
      expect(host.querySelector('.dc-material-item__description')).toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('renders custom content inside the designer-owned draggable shell', async () => {
    const meta = makeMeta()
    const designer = createDesigner({
      widgetMetas: [meta],
      extensions: {
        materialItemRenderer: props =>
          h('div', {
            class: ['custom-material-item', { dragging: props.dragging }],
          }, `${props.material.title}:${props.meta.type}`),
      },
    })
    const { app, host, ctx } = mountItem(designer, meta)

    try {
      await nextTick()
      const item = host.querySelector('.dc-material-item')!
      const customContent = host.querySelector('.custom-material-item')!

      expect(customContent.textContent).toBe('Action Button:button')
      expect(item.classList.contains('dc-material-item--custom')).toBe(true)
      item.dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }))

      expect(ctx.handleMaterialDragStart).toHaveBeenCalledWith(expect.any(Event), meta)
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
