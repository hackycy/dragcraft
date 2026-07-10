// @vitest-environment happy-dom
import type { DesignerContext, DesignerInstance, DesignerSchema, WidgetMeta } from '..'
import { I18N_KEY } from '@dragcraft/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { createDesigner, DESIGNER_CONTEXT_KEY } from '..'
import DcLeftSidebar from './DcLeftSidebar'

function makeMeta(): WidgetMeta {
  return {
    type: 'button',
    title: '按钮',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
  } as WidgetMeta
}

function makeSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [
        { id: 'node-a', type: 'button', props: {} },
      ],
    },
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
    workspace: instance.workspace,
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
    activeTab: instance.workspace.activeRightPanel,
    leftPanelActiveTab: instance.workspace.activeLeftPanel,
  }
}

function mountSidebar(instance: DesignerInstance) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const ctx = makeContext(instance)
  const app = createApp(defineComponent({
    setup() {
      provide(DESIGNER_CONTEXT_KEY, ctx)
      provide(I18N_KEY, instance.i18n)
      return () => h(DcLeftSidebar)
    },
  }))
  app.mount(host)
  return { app, host, ctx }
}

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

describe('dcLeftSidebar', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the material panel by default', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
    })
    const { app, host } = mountSidebar(designer)

    try {
      await nextTick()
      expect(host.querySelector('.dc-material-panel')).not.toBeNull()
      expect(host.querySelector('.dc-structure-panel')).toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('switches to the structure panel from the icon tab', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
    })
    const { app, host, ctx } = mountSidebar(designer)

    try {
      await nextTick()
      click(host.querySelector('[aria-label="结构树"]')!)
      await nextTick()

      expect(ctx.leftPanelActiveTab.value).toBe('structure')
      expect(host.querySelector('.dc-structure-panel')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('uses materialPanelRenderer for the materials tab content', async () => {
    const CustomMaterialPanel = defineComponent({
      setup() {
        return () => h('div', { class: 'custom-material-panel' }, 'custom')
      },
    })
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
      extensions: {
        materialPanelRenderer: CustomMaterialPanel,
      },
    })
    const { app, host } = mountSidebar(designer)

    try {
      await nextTick()
      expect(host.querySelector('.custom-material-panel')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
