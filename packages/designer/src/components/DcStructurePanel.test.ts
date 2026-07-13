// @vitest-environment happy-dom
import type { DesignerInstance, DesignerSchema, WidgetMeta } from '..'
import type { DesignerContext } from '../types'
import { I18N_KEY } from '@dragcraft/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { CommandType, createDesigner, DESIGNER_CONTEXT_KEY } from '..'
import DcStructurePanel from './DcStructurePanel'

function makeMeta(overrides?: Partial<WidgetMeta>): WidgetMeta {
  return {
    type: 'button',
    title: '按钮',
    group: 'basic',
    defaultProps: {},
    formSchema: { sections: [] },
    ...overrides,
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
        { id: 'node-b', type: 'text', props: {} },
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
    activeDestination: ref(null),
    containerDropDecision: ref(null),
    dragOverNodeId: ref(null),
    dragOverIndex: ref(null),
    handleMaterialDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleCanvasDragOver: vi.fn(),
    handleCanvasDragLeave: vi.fn(),
    handleCanvasDrop: vi.fn(),
    handleContainerDragOver: vi.fn(),
    handleContainerDragLeave: vi.fn(),
    handleContainerDrop: vi.fn(),
    isForbidden: ref(false),
    forbiddenReason: ref(null),
    searchQuery: ref(''),
    activeTab: instance.workspace.activeRightPanel,
    leftPanelActiveTab: instance.workspace.activeLeftPanel,
  }
}

function mountPanel(instance: DesignerInstance) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const ctx = makeContext(instance)
  const app = createApp(defineComponent({
    setup() {
      provide(DESIGNER_CONTEXT_KEY, ctx)
      provide(I18N_KEY, instance.i18n)
      return () => h(DcStructurePanel)
    },
  }))
  app.mount(host)
  return { app, host, ctx }
}

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

describe('dcStructurePanel', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders node titles and ids', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [
        makeMeta({ type: 'button', title: '按钮' }),
        makeMeta({ type: 'text', title: '文本' }),
      ],
    })
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      expect(host.textContent).toContain('按钮')
      expect(host.textContent).toContain('node-a')
      expect(host.textContent).toContain('文本')
      expect(host.textContent).toContain('node-b')
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('selects the matching canvas node and fires after-select hook', async () => {
    const onAfterSelect = vi.fn()
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
      eventHooks: { onAfterSelect },
    })
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      click(host.querySelector('[data-node-id="node-a"] .dc-structure-panel__select')!)
      await nextTick()

      expect(designer.engine.store.selectedNodeId.value).toBe('node-a')
      expect(onAfterSelect).toHaveBeenCalledWith({ nodeId: 'node-a' })
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('does not select when before-select returns false', async () => {
    const onAfterSelect = vi.fn()
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
      eventHooks: {
        onBeforeSelect: vi.fn(() => false),
        onAfterSelect,
      },
    })
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      click(host.querySelector('[data-node-id="node-a"] .dc-structure-panel__select')!)
      await nextTick()

      expect(designer.engine.store.selectedNodeId.value).toBeNull()
      expect(onAfterSelect).not.toHaveBeenCalled()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('uses the resolved delete action to remove nodes', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
    })
    const execute = vi.spyOn(designer.engine, 'execute')
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      click(host.querySelector('.dc-structure-panel__delete')!)

      expect(execute).toHaveBeenCalledWith({
        type: CommandType.REMOVE_NODE,
        payload: { nodeId: 'node-a' },
      })
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('keeps the delete button outside a nested row button', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta()],
    })
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      const row = host.querySelector('[data-node-id="node-a"]')
      const deleteButton = host.querySelector('.dc-structure-panel__delete')

      expect(row?.tagName).toBe('DIV')
      expect(deleteButton?.closest('button')).toBe(deleteButton)
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('disables delete when the widget is not deletable', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeSchema() },
      widgetMetas: [makeMeta({ deletable: false })],
    })
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      const deleteButton = host.querySelector<HTMLButtonElement>('.dc-structure-panel__delete')
      expect(deleteButton?.disabled).toBe(true)
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
