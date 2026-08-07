import type { ResolvedDocument } from '@dragcraft/core'
import { useI18n } from '@dragcraft/i18n'
import { IconArrowDown, IconArrowUp, IconCopy, IconDelete } from '@dragcraft/icons'
import { DcScrollArea } from '@dragcraft/ui'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import { projectNodeToolbarActions } from '../presentation/node-action-projection'

type ResolvedNode = ResolvedDocument['root'][number]

export default defineComponent({
  name: 'DcStructurePanel',
  setup() {
    const context = useDesignerContext()
    const { t } = useI18n()
    const renderNode = (node: ResolvedNode, document: ResolvedDocument) => {
      const selected = context.designer.selection.selectedNodeId.value === node.node.id
      const material = context.catalog.getMaterial(node.node.type)
      const title = material?.panel?.titleKey
        ? t(material.panel.titleKey, material.panel.title ?? node.node.type)
        : material?.panel?.title ?? node.node.type
      const actionStates = projectNodeToolbarActions({
        catalog: context.catalog,
        document,
        evaluate: context.evaluateWorkbenchAction,
        nodeId: node.node.id,
      }).filter(action => action.visible && action.name !== 'drag')
      const actions = actionStates.length > 0
        ? h('div', { 'class': 'dc-structure-panel__actions', 'data-dc-part': 'actions' }, actionStates.map((action) => {
            const definition = {
              'move-up': { fallback: '上移', icon: IconArrowUp, key: 'action.move-up' },
              'move-down': { fallback: '下移', icon: IconArrowDown, key: 'action.move-down' },
              'duplicate': { fallback: '复制', icon: IconCopy, key: 'action.duplicate' },
              'remove': { fallback: '删除', icon: IconDelete, key: 'action.delete' },
            }[action.name]
            const label = t(definition.key, definition.fallback)
            return h('button', {
              'type': 'button',
              'class': ['dc-structure-panel__action', { 'dc-structure-panel__delete': action.name === 'remove' }],
              'data-dc-part': 'action',
              'data-dc-action': action.name,
              'data-dc-state': action.name === 'remove' ? 'danger' : undefined,
              'title': label,
              'aria-label': label,
              'disabled': action.disabled,
              'onClick': action.disabled || !action.action
                ? undefined
                : (event: MouseEvent) => {
                    event.stopPropagation()
                    context.executeWorkbenchAction(action.action!)
                  },
            }, [h(definition.icon, { size: 15 })])
          }))
        : null
      return h('div', {
        'class': ['dc-structure-panel__item', { 'dc-structure-panel__item--selected': selected }],
        'data-dc-component': 'structure-item',
        'data-dc-node-id': node.node.id,
        'data-dc-state': selected ? 'selected' : undefined,
      }, [
        h('button', {
          'type': 'button',
          'class': 'dc-structure-panel__select',
          'data-dc-part': 'select',
          'aria-pressed': selected,
          'onClick': () => context.executeWorkbenchAction({ type: 'select-node', nodeId: node.node.id }),
        }, [
          h('span', { 'class': 'dc-structure-panel__branch', 'data-dc-part': 'branch' }),
          h('span', { 'class': 'dc-structure-panel__main', 'data-dc-part': 'main' }, [
            h('span', { 'class': 'dc-structure-panel__title', 'data-dc-part': 'title' }, title),
            h('span', { 'class': 'dc-structure-panel__id', 'data-dc-part': 'id' }, node.node.id),
          ]),
        ]),
        actions,
      ])
    }
    return () => {
      const document = context.resolvedDocument.value
      const rows = document?.root.flatMap((node) => {
        const container = document.containersById.get(node.node.id)
        return [
          h('div', { key: node.node.id, class: 'dc-structure-panel__row' }, [renderNode(node, document)]),
          ...Array.from(container?.regions.values() ?? []).map(region => h('div', {
            'key': `${node.node.id}:${region.id}`,
            'class': 'dc-structure-panel__region-branch',
            'data-dc-component': 'structure-region',
            'data-dc-part': 'branch',
            'data-dc-region-id': region.id,
          }, [
            h('div', { 'class': 'dc-structure-panel__region', 'data-dc-part': 'row' }, [
              h('span', { 'class': 'dc-structure-panel__region-title', 'data-dc-part': 'title' }, region.id),
              h('span', { 'class': 'dc-structure-panel__region-count', 'data-dc-part': 'count' }, String(region.children.length)),
            ]),
            h('div', { 'class': 'dc-structure-panel__children', 'data-dc-part': 'children' }, region.children.map(child => renderNode(child, document))),
          ])),
        ]
      }) ?? []
      return h('div', { 'class': 'dc-structure-panel', 'data-dc-component': 'structure-panel' }, [
        h('div', { 'class': 'dc-structure-panel__header', 'data-dc-part': 'header' }, [
          h('span', { 'data-dc-part': 'heading' }, t('panel.structure.title', '结构树')),
        ]),
        rows.length === 0
          ? h('div', { 'class': 'dc-structure-panel__empty', 'data-dc-part': 'empty' }, t('panel.structure.empty', '暂无结构'))
          : h(DcScrollArea, { 'class': 'dc-structure-panel__list', 'data-dc-part': 'list' }, {
              default: () => h('div', { class: 'dc-structure-panel__list-content' }, rows),
            }),
      ])
    }
  },
})
