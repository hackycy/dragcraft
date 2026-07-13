import type { DesignerEngine, NodeOwner, SchemaNode } from '@dragcraft/core'
import type { MaybePromise, NodeActionContext, ResolvedNodeAction, SelectHookPayload } from '@dragcraft/renderer'
import { createContainerPlan, createLayoutPlan, getSortScopeEntries, resolveNodeLayout } from '@dragcraft/core'
import { ActionKey } from '@dragcraft/renderer'
import { useI18n } from '@dragcraft/utils'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

interface StructureItem {
  node: SchemaNode
  title: string
  actions: ResolvedNodeAction[]
  regions: ContainerStructureRegion[]
}

interface ContainerStructureRegion {
  id: string
  title: string
  owner: Extract<NodeOwner, { kind: 'container' }>
  nodes: SchemaNode[]
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return value !== null && typeof value === 'object' && typeof (value as Promise<unknown>).then === 'function'
}

function createContainerStructureRegions(
  node: SchemaNode,
  engine: DesignerEngine,
  t: (key: string, fallback?: string) => string,
): ContainerStructureRegion[] {
  const result = createContainerPlan(node, engine.registry)
  if (!result.ok)
    return []

  return result.plan.regions.map(region => ({
    id: region.definition.id,
    title: region.definition.titleKey
      ? t(region.definition.titleKey, region.definition.title)
      : region.definition.title,
    owner: {
      kind: 'container',
      containerId: result.plan.containerId,
      regionId: region.definition.id,
    },
    nodes: region.nodes,
  }))
}

export default defineComponent({
  name: 'DcStructurePanel',

  setup() {
    const ctx = useDesignerContext()
    const { t } = useI18n()
    const { engine, actionRegistry, actionInterceptors, eventHooks } = ctx
    const selectPending = { value: false }

    const createStructureItem = (
      node: SchemaNode,
      owner: NodeOwner,
      index: number,
      siblingCount: number,
      sortScope: string | false,
    ): StructureItem => {
      const meta = engine.registry.getWidget(node.type)
      const actionCtx: NodeActionContext = {
        node,
        owner,
        index,
        siblingCount,
        sortScope,
        meta,
        engine,
      }
      const actions = actionRegistry.resolve(actionCtx, actionInterceptors)

      return {
        node,
        title: meta
          ? (meta.titleKey ? t(meta.titleKey, meta.title) : meta.title)
          : node.type,
        actions: owner.kind === 'container'
          ? actions
          : actions.filter(action => action.key === ActionKey.DELETE),
        regions: createContainerStructureRegions(node, engine, t),
      }
    }

    const items = computed<StructureItem[]>(() => {
      void engine.store.schema.value

      const schema = engine.state.getSchema()
      const children = schema.root.children ?? []
      const plan = createLayoutPlan(schema, engine.registry)

      return children.map((node) => {
        const layout = resolveNodeLayout(node, engine.registry, schema)
        const scopeEntries = layout.sortScope === false
          ? []
          : getSortScopeEntries(plan, layout.sortScope)
        return createStructureItem(
          node,
          {
            kind: 'root',
            sortScope: layout.sortScope === false ? undefined : layout.sortScope,
          },
          scopeEntries.findIndex(entry => entry.node.id === node.id),
          scopeEntries.length,
          layout.sortScope,
        )
      })
    })

    const fireAfterSelect = (payload: SelectHookPayload) => {
      if (!eventHooks.onAfterSelect)
        return
      try {
        const result = eventHooks.onAfterSelect(payload)
        if (isPromiseLike(result)) {
          result.catch((err) => {
            console.error('[dragcraft] Async after-hook error:', err)
          })
        }
      }
      catch (err) {
        console.error('[dragcraft] After-hook error:', err)
      }
    }

    const executeSelect = (payload: SelectHookPayload) => {
      engine.store.selectNode(payload.nodeId)
      fireAfterSelect({ nodeId: payload.nodeId })
    }

    const resolveSelect = (
      result: MaybePromise<boolean | void>,
      payload: SelectHookPayload,
    ) => {
      if (!isPromiseLike(result)) {
        if (result !== false)
          executeSelect(payload)
        return
      }

      selectPending.value = true
      result
        .then((allowed) => {
          if (allowed !== false)
            executeSelect(payload)
        })
        .catch((err) => {
          console.error('[dragcraft] Before-hook error (action cancelled):', err)
        })
        .finally(() => {
          selectPending.value = false
        })
    }

    const handleSelect = (node: SchemaNode, e: MouseEvent) => {
      if (selectPending.value)
        return

      const payload = { nodeId: node.id, event: e }
      if (!eventHooks.onBeforeSelect) {
        executeSelect(payload)
        return
      }

      try {
        resolveSelect(eventHooks.onBeforeSelect(payload), payload)
      }
      catch (err) {
        console.error('[dragcraft] Before-hook error (action cancelled):', err)
      }
    }

    const renderActionButton = (action: ResolvedNodeAction) => {
      return h('button', {
        'type': 'button',
        'class': [
          'dc-structure-panel__action',
          { 'dc-structure-panel__delete': action.key === ActionKey.DELETE },
          action.className,
        ],
        'data-dc-action-key': action.key,
        'title': action.label,
        'aria-label': action.label,
        'disabled': action.disabled,
        'onClick': (e: MouseEvent) => {
          e.stopPropagation()
          if (!action.disabled)
            action.handler(e)
        },
      }, typeof action.icon === 'string' ? action.icon : (action.icon ? h(action.icon) : undefined))
    }

    const renderActions = (actions: ResolvedNodeAction[]) => {
      const buttons = actions
        .filter(action => action.type === 'button')
        .map(renderActionButton)
      return buttons.length > 0
        ? h('div', { class: 'dc-structure-panel__actions' }, buttons)
        : null
    }

    const renderItem = (item: StructureItem) => {
      const selected = engine.store.selectedNodeId.value === item.node.id

      return h('div', {
        'class': [
          'dc-structure-panel__item',
          { 'dc-structure-panel__item--selected': selected },
        ],
        'data-node-id': item.node.id,
      }, [
        h('button', {
          'type': 'button',
          'class': 'dc-structure-panel__select',
          'aria-pressed': selected,
          'onClick': (e: MouseEvent) => handleSelect(item.node, e),
        }, [
          h('span', { class: 'dc-structure-panel__branch' }),
          h('span', { class: 'dc-structure-panel__main' }, [
            h('span', { class: 'dc-structure-panel__title', title: item.title }, item.title),
            h('span', { class: 'dc-structure-panel__id', title: item.node.id }, item.node.id),
          ]),
        ]),
        renderActions(item.actions),
      ])
    }

    const renderRegion = (region: ContainerStructureRegion) => h('div', {
      key: region.id,
      class: 'dc-structure-panel__region-branch',
    }, [
      h('div', {
        'class': 'dc-structure-panel__region',
        'data-dc-region-id': region.id,
      }, [
        h('span', { 'class': 'dc-structure-panel__region-branch-mark', 'aria-hidden': 'true' }),
        h('span', { class: 'dc-structure-panel__region-title', title: region.title }, region.title),
        h('span', { class: 'dc-structure-panel__region-count' }, String(region.nodes.length)),
      ]),
      region.nodes.length > 0
        ? h('div', { class: 'dc-structure-panel__children' }, region.nodes.map((node, index) => {
            const item = createStructureItem(node, region.owner, index, region.nodes.length, false)
            return h('div', { key: node.id, class: 'dc-structure-panel__row' }, [renderItem(item)])
          }))
        : null,
    ])

    const renderStructureItem = (item: StructureItem) => h('div', {
      key: item.node.id,
      class: 'dc-structure-panel__row',
    }, [
      renderItem(item),
      item.regions.length > 0
        ? h('div', { class: 'dc-structure-panel__regions' }, item.regions.map(renderRegion))
        : null,
    ])

    return () => h('div', { class: 'dc-structure-panel' }, [
      h('div', { class: 'dc-structure-panel__header' }, [
        h('span', { class: 'dc-structure-panel__heading' }, t('panel.structure.title', '结构树')),
      ]),
      items.value.length === 0
        ? h('div', { class: 'dc-structure-panel__empty' }, t('panel.structure.empty', '暂无结构'))
        : h('div', { class: 'dc-structure-panel__list' }, items.value.map(renderStructureItem)),
    ])
  },
})
