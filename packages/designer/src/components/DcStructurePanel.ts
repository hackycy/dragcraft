import type { DocumentSchema, NodeDefinition } from '@dragcraft/core'
import type { NodeActionContext, ResolvedNodeAction } from '../presentation/action-registry'
import type { DeepReadonly, NodeOwner } from '../presentation/semantic'
import type { PresentationNode } from '../presentation/types'
import { useI18n } from '@dragcraft/i18n'
import { DcScrollArea } from '@dragcraft/ui'
import { computed, defineComponent, h } from 'vue'
import { useDesignerContext } from '../context'
import { ActionKey } from '../presentation/action-registry'
import { resolveContainerRegions } from '../presentation/material-presentation'
import { useDesignerSession } from '../session/context'

interface StructureItem {
  node: DeepReadonly<NodeDefinition>
  title: string
  actions: ResolvedNodeAction[]
  regions: ContainerStructureRegion[]
}

interface ContainerStructureRegion {
  id: string
  title: string
  owner: Extract<NodeOwner, { kind: 'container' }>
  nodes: readonly DeepReadonly<PresentationNode>[]
  lockedIndices: Set<number>
}

function createContainerStructureRegions(
  node: DeepReadonly<NodeDefinition>,
  session: ReturnType<typeof useDesignerSession>,
  t: (key: string, fallback?: string) => string,
): ContainerStructureRegion[] {
  const regions = resolveContainerRegions(session, node)
  return regions.map(region => ({
    id: region.id,
    title: region.titleKey
      ? t(region.titleKey, region.title)
      : region.title,
    owner: {
      kind: 'container',
      containerId: node.id,
      regionId: region.id,
    },
    nodes: session.document.getRegionNodes(node.id, region.id) as unknown as readonly DeepReadonly<PresentationNode>[],
    lockedIndices: session.materials.getLockedIndices(session.document.getRegionNodes(node.id, region.id)),
  }))
}

export default defineComponent({
  name: 'DcStructurePanel',

  setup() {
    const ctx = useDesignerContext()
    const session = useDesignerSession()
    const { t } = useI18n()
    const { actionRegistry, actionInterceptors } = ctx
    const actionSchema = computed<DeepReadonly<DocumentSchema> | null>(() => session.document.schema.value)

    const createStructureItem = (
      node: DeepReadonly<NodeDefinition>,
      owner: NodeOwner,
      index: number,
      siblingCount: number,
      schema: DeepReadonly<DocumentSchema> | null,
      lockedIndices: Set<number>,
    ): StructureItem => {
      const material = session.materials.get(node.type)
      const actionCtx: NodeActionContext = {
        node: node as unknown as NodeDefinition,
        owner,
        index,
        siblingCount,
        material,
        materials: session.materials,
        session,
        schema,
        lockedIndices,
      }
      const actions = actionRegistry.resolve(
        actionCtx,
        actionInterceptors,
        owner.kind === 'root' ? [ActionKey.DELETE] : undefined,
      )

      return {
        node,
        title: material
          ? (material.panel?.titleKey
              ? t(material.panel.titleKey, material.panel.title ?? material.type)
              : material.panel?.title ?? material.type)
          : node.type,
        actions,
        regions: createContainerStructureRegions(node, session, t),
      }
    }

    const items = computed<StructureItem[]>(() => {
      const children = session.document.rootNodes.value
      return children.map((node, rootIndex) => {
        const position = session.document.getStructurePosition(node.id)
        return createStructureItem(
          node,
          position?.owner ?? { kind: 'root' },
          position?.index ?? rootIndex,
          position?.siblingCount ?? children.length,
          actionSchema.value,
          new Set(),
        )
      })
    })

    const handleSelect = (node: DeepReadonly<NodeDefinition>, e: MouseEvent) => {
      e.stopPropagation()
      session.execute({ type: 'selection.set', nodeId: node.id })
    }

    const renderActionButton = (action: ResolvedNodeAction) => {
      return h('button', {
        'type': 'button',
        'class': [
          'dc-structure-panel__action',
          { 'dc-structure-panel__delete': action.key === ActionKey.DELETE },
          action.className,
        ],
        'data-dc-part': 'action',
        'data-dc-state': action.key === ActionKey.DELETE ? 'danger' : undefined,
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
        ? h('div', { 'class': 'dc-structure-panel__actions', 'data-dc-part': 'actions' }, buttons)
        : null
    }

    const renderItem = (item: StructureItem) => {
      const selected = session.state.selectedNodeId.value === item.node.id

      return h('div', {
        'class': [
          'dc-structure-panel__item',
          { 'dc-structure-panel__item--selected': selected },
        ],
        'data-dc-component': 'structure-item',
        'data-dc-state': selected ? 'selected' : undefined,
        'data-node-id': item.node.id,
      }, [
        h('button', {
          'type': 'button',
          'class': 'dc-structure-panel__select',
          'data-dc-part': 'select',
          'aria-pressed': selected,
          'onClick': (e: MouseEvent) => handleSelect(item.node, e),
        }, [
          h('span', { 'class': 'dc-structure-panel__branch', 'data-dc-part': 'branch' }),
          h('span', { 'class': 'dc-structure-panel__main', 'data-dc-part': 'main' }, [
            h('span', { 'class': 'dc-structure-panel__title', 'data-dc-part': 'title', 'title': item.title }, item.title),
            h('span', { 'class': 'dc-structure-panel__id', 'data-dc-part': 'id', 'title': item.node.id }, item.node.id),
          ]),
        ]),
        renderActions(item.actions),
      ])
    }

    const renderRegion = (region: ContainerStructureRegion) => h('div', {
      'key': region.id,
      'class': 'dc-structure-panel__region-branch',
      'data-dc-component': 'structure-region',
    }, [
      h('div', {
        'class': 'dc-structure-panel__region',
        'data-dc-part': 'row',
        'data-dc-region-id': region.id,
      }, [
        h('span', { 'class': 'dc-structure-panel__region-branch-mark', 'data-dc-part': 'branch', 'aria-hidden': 'true' }),
        h('span', { 'class': 'dc-structure-panel__region-title', 'data-dc-part': 'title', 'title': region.title }, region.title),
        h('span', { 'class': 'dc-structure-panel__region-count', 'data-dc-part': 'count' }, String(region.nodes.length)),
      ]),
      region.nodes.length > 0
        ? h('div', { 'class': 'dc-structure-panel__children', 'data-dc-part': 'children' }, region.nodes.map((node, index) => {
            const item = createStructureItem(
              node as unknown as NodeDefinition,
              region.owner,
              index,
              region.nodes.length,
              actionSchema.value,
              region.lockedIndices,
            )
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

    return () => h('div', { 'class': 'dc-structure-panel', 'data-dc-component': 'structure-panel' }, [
      h('div', { 'class': 'dc-structure-panel__header', 'data-dc-part': 'header' }, [
        h('span', { 'class': 'dc-structure-panel__heading', 'data-dc-part': 'heading' }, t('panel.structure.title', '结构树')),
      ]),
      items.value.length === 0
        ? h('div', { 'class': 'dc-structure-panel__empty', 'data-dc-part': 'empty' }, t('panel.structure.empty', '暂无结构'))
        : h(DcScrollArea, { 'class': 'dc-structure-panel__list', 'data-dc-part': 'list' }, {
            default: () => h('div', { class: 'dc-structure-panel__list-content' }, items.value.map(renderStructureItem)),
          }),
    ])
  },
})
