import type { ResolvedDocument } from '@dragcraft/core'
import { useI18n } from '@dragcraft/i18n'
import { IconArrowDown, IconArrowUp, IconCopy, IconDelete } from '@dragcraft/icons'
import { DcScrollArea } from '@dragcraft/ui'
import { defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'

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
      const location = document.locationsById.get(node.node.id)
      const owner = location?.kind === 'container-region'
        ? { kind: 'container-region' as const, containerId: location.containerId, regionId: location.regionId }
        : location
          ? { kind: 'page-root' as const }
          : null
      const siblings = location?.kind === 'container-region'
        ? document.containersById.get(location.containerId)?.regions.get(location.regionId)?.children ?? []
        : location
          ? document.root
          : []
      const previous = location ? siblings[location.index - 1]?.node.id : undefined
      const next = location ? siblings[location.index + 1]?.node.id : undefined
      const action = (name: string, label: string, icon: typeof IconDelete, disabled: boolean, execute: () => void) => h('button', {
        'type': 'button',
        'class': ['dc-structure-panel__action', { 'dc-structure-panel__delete': name === 'remove' }],
        'data-dc-part': 'action',
        'data-dc-action': name,
        'data-dc-state': name === 'remove' ? 'danger' : undefined,
        'title': label,
        'aria-label': label,
        disabled,
        'onClick': (event: MouseEvent) => {
          event.stopPropagation()
          execute()
        },
      }, [h(icon, { size: 15 })])
      const actions = owner
        ? h('div', { 'class': 'dc-structure-panel__actions', 'data-dc-part': 'actions' }, [
            action('move-up', t('action.move-up', '上移'), IconArrowUp, !previous, () => {
              if (previous)
                context.executeWorkbenchAction({ type: 'move-node', nodeId: node.node.id, to: { owner, position: { kind: 'before', nodeId: previous } } })
            }),
            action('move-down', t('action.move-down', '下移'), IconArrowDown, !next, () => {
              if (next)
                context.executeWorkbenchAction({ type: 'move-node', nodeId: node.node.id, to: { owner, position: { kind: 'after', nodeId: next } } })
            }),
            action('duplicate', t('action.duplicate', '复制'), IconCopy, false, () => {
              context.executeWorkbenchAction({ type: 'duplicate-node', nodeId: node.node.id, to: { owner, position: { kind: 'after', nodeId: node.node.id } } })
            }),
            action('remove', t('action.delete', '删除'), IconDelete, false, () => {
              context.executeWorkbenchAction({ type: 'remove-node', nodeId: node.node.id })
            }),
          ])
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
