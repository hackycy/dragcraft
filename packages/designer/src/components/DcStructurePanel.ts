import type { SchemaNode } from '@dragcraft/core'
import type { MaybePromise, NodeActionContext, ResolvedNodeAction, SelectHookPayload } from '@dragcraft/renderer'
import { createLayoutPlan, getSortScopeEntries, resolveNodeLayout } from '@dragcraft/core'
import { ActionKey } from '@dragcraft/renderer'
import { useI18n } from '@dragcraft/utils'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

interface StructureItem {
  node: SchemaNode
  title: string
  deleteAction: ResolvedNodeAction | undefined
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return value !== null && typeof value === 'object' && typeof (value as Promise<unknown>).then === 'function'
}

export default defineComponent({
  name: 'DcStructurePanel',

  setup() {
    const ctx = useDesignerContext()
    const { t } = useI18n()
    const { engine, actionRegistry, actionInterceptors, eventHooks } = ctx
    const selectPending = { value: false }

    const items = computed<StructureItem[]>(() => {
      void engine.store.schema.value

      const schema = engine.state.getSchema()
      const children = schema.root.children ?? []
      const plan = createLayoutPlan(schema, engine.registry)

      return children.map((node) => {
        const meta = engine.registry.getWidget(node.type)
        const layout = resolveNodeLayout(node, engine.registry, schema)
        const scopeEntries = layout.sortScope === false
          ? []
          : getSortScopeEntries(plan, layout.sortScope)
        const actionCtx: NodeActionContext = {
          node,
          index: scopeEntries.findIndex(entry => entry.node.id === node.id),
          siblingCount: scopeEntries.length,
          sortScope: layout.sortScope,
          meta,
          engine,
        }
        const actions = actionRegistry.resolve(actionCtx, actionInterceptors)

        return {
          node,
          title: meta
            ? (meta.titleKey ? t(meta.titleKey, meta.title) : meta.title)
            : node.type,
          deleteAction: actions.find(action => action.key === ActionKey.DELETE),
        }
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

    const renderDeleteButton = (action: ResolvedNodeAction | undefined) => {
      if (!action)
        return null

      return h('button', {
        'type': 'button',
        'class': [
          'dc-structure-panel__delete',
          action.className,
        ],
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

    const renderItem = (item: StructureItem) => {
      const selected = engine.store.selectedNodeId.value === item.node.id

      const handleRowKeydown = (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ')
          return
        e.preventDefault()
        handleSelect(item.node, e as unknown as MouseEvent)
      }

      return h('div', {
        'class': [
          'dc-structure-panel__item',
          { 'dc-structure-panel__item--selected': selected },
        ],
        'data-node-id': item.node.id,
        'role': 'button',
        'tabindex': 0,
        'onClick': (e: MouseEvent) => handleSelect(item.node, e),
        'onKeydown': handleRowKeydown,
      }, [
        h('span', { class: 'dc-structure-panel__branch' }),
        h('span', { class: 'dc-structure-panel__main' }, [
          h('span', { class: 'dc-structure-panel__title', title: item.title }, item.title),
          h('span', { class: 'dc-structure-panel__id', title: item.node.id }, item.node.id),
        ]),
        renderDeleteButton(item.deleteAction),
      ])
    }

    return () => h('div', { class: 'dc-structure-panel' }, [
      h('div', { class: 'dc-structure-panel__header' }, [
        h('span', { class: 'dc-structure-panel__heading' }, t('panel.structure.title', '结构树')),
      ]),
      items.value.length === 0
        ? h('div', { class: 'dc-structure-panel__empty' }, t('panel.structure.empty', '暂无结构'))
        : h('div', { class: 'dc-structure-panel__list' }, items.value.map(item =>
            h('div', { key: item.node.id, class: 'dc-structure-panel__row' }, [
              renderItem(item),
            ]),
          )),
    ])
  },
})
