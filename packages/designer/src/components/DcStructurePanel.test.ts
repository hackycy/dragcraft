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

function makeStructureSchema(): DesignerSchema {
  return {
    version: '1.0.0',
    globalConfig: {},
    root: {
      id: 'root',
      type: 'root',
      props: {},
      children: [{
        id: 'layout',
        type: 'layout',
        props: {},
        container: {
          variant: 'split',
          regions: {
            right: [{ id: 'nested-right', type: 'text', props: {} }],
            left: [
              { id: 'nested-a', type: 'button', props: {} },
              { id: 'nested-b', type: 'text', props: {} },
            ],
          },
        },
      }],
    },
  }
}

function makeStructureMetas(): WidgetMeta[] {
  return [
    makeMeta({
      type: 'layout',
      title: 'Layout',
      container: {
        defaultVariant: 'split',
        variants: {
          split: {
            title: 'Split',
            regions: [
              { id: 'left', title: 'Left fallback', titleKey: 'region.left' },
              { id: 'right', title: 'Right' },
            ],
          },
        },
      },
    }),
    makeMeta({ type: 'button', title: 'Button' }),
    makeMeta({ type: 'text', title: 'Text' }),
  ]
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

  it('renders translated virtual regions with counts and nested widgets in registration order', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeStructureSchema() },
      widgetMetas: makeStructureMetas(),
      locale: 'en',
      messages: { en: { region: { left: 'Left translated' } } },
    })
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      const regions = Array.from(host.querySelectorAll('[data-dc-region-id]'))
      expect(regions.map(el => el.getAttribute('data-dc-region-id'))).toEqual(['left', 'right'])
      expect(regions[0].textContent).toContain('Left translated')
      expect(regions[0].textContent).toContain('2')
      expect(regions[1].textContent).toContain('Right')
      expect(regions[1].textContent).toContain('1')

      const nodeIds = Array.from(host.querySelectorAll('[data-node-id]'))
        .map(el => el.getAttribute('data-node-id'))
      expect(nodeIds).toEqual(['layout', 'nested-a', 'nested-b', 'nested-right'])
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('keeps region rows unselectable while nested widgets use selection hooks', async () => {
    const onAfterSelect = vi.fn()
    const designer = createDesigner({
      engineOptions: { initialSchema: makeStructureSchema() },
      widgetMetas: makeStructureMetas(),
      eventHooks: { onAfterSelect },
    })
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      const region = host.querySelector('[data-dc-region-id="left"]')!
      expect(region.querySelector('button')).toBeNull()
      click(region)
      expect(designer.engine.store.selectedNodeId.value).toBeNull()

      click(host.querySelector('[data-node-id="nested-a"] .dc-structure-panel__select')!)
      await nextTick()
      expect(designer.engine.store.selectedNodeId.value).toBe('nested-a')
      expect(onAfterSelect).toHaveBeenCalledWith({ nodeId: 'nested-a' })
      expect(host.querySelector('[data-node-id="nested-a"]')?.getAttribute('data-dc-component')).toBe('structure-item')
      expect(host.querySelector('[data-node-id="nested-a"]')?.getAttribute('data-dc-state')).toBe('selected')
      expect(host.querySelector('[data-dc-component="structure-region"] > [data-dc-part="row"]')).not.toBeNull()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })

  it('uses container ownership and local indices for nested actions', async () => {
    const designer = createDesigner({
      engineOptions: { initialSchema: makeStructureSchema() },
      widgetMetas: makeStructureMetas(),
    })
    const execute = vi.spyOn(designer.engine, 'execute')
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      const nested = host.querySelector('[data-node-id="nested-a"]')!
      expect(nested.querySelector('[data-dc-part="action"][data-dc-state="danger"]')).not.toBeNull()

      click(nested.querySelector('[data-dc-action-key="move-down"]')!)
      click(nested.querySelector('[data-dc-action-key="duplicate"]')!)
      click(nested.querySelector('[data-dc-action-key="delete"]')!)

      expect(execute).toHaveBeenNthCalledWith(1, {
        type: CommandType.MOVE_NODE,
        payload: {
          nodeId: 'nested-a',
          destination: {
            kind: 'container',
            containerId: 'layout',
            regionId: 'left',
            index: 2,
          },
        },
      })
      expect(execute).toHaveBeenNthCalledWith(2, {
        type: CommandType.DUPLICATE_NODE,
        payload: { nodeId: 'nested-a' },
      })
      expect(execute).toHaveBeenNthCalledWith(3, {
        type: CommandType.REMOVE_NODE,
        payload: { nodeId: 'nested-a' },
      })
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

  it('resolves root structure actions with one schema and lock pass per revision', async () => {
    const nodeCount = 12
    const sortable = vi.fn(() => true)
    const unrelatedVisible = vi.fn(() => true)
    const schema = makeSchema()
    schema.root.children = Array.from({ length: nodeCount }, (_, index) => ({
      id: `node-${index}`,
      type: 'button',
      props: {},
    }))
    const designer = createDesigner({
      engineOptions: { initialSchema: schema },
      widgetMetas: [makeMeta({ sortable })],
      customActions: [{
        key: 'unrelated',
        label: 'Unrelated',
        type: 'button',
        order: 999,
        visible: unrelatedVisible,
      }],
    })
    const getSchema = vi.spyOn(designer.engine.state, 'getSchema')
    const { app, host } = mountPanel(designer)

    try {
      await nextTick()
      expect(host.querySelectorAll('[data-dc-component="structure-item"]')).toHaveLength(nodeCount)
      expect(getSchema).toHaveBeenCalledOnce()
      expect(sortable).toHaveBeenCalledTimes(nodeCount)
      expect(unrelatedVisible).not.toHaveBeenCalled()
    }
    finally {
      app.unmount()
      designer.dispose()
    }
  })
})
