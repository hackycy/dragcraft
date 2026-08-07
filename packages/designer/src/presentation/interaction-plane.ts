import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { AuthoringAction, AuthoringResult, SchemaAuthoringAction } from '../authoring/types'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import type { GeometryRegistry } from './geometry-registry'
import type { PresentationDiagnosticRegistry } from './presentation-diagnostics'
import { useI18n } from '@dragcraft/i18n'
import { IconArrowDown, IconArrowUp, IconComponent, IconCopy, IconDelete, IconDrag } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'
import { projectNodeToolbarActions } from './node-action-projection'

export default defineComponent({
  name: 'DcInteractionPlane',
  props: {
    geometry: {
      type: Object as PropType<GeometryRegistry>,
      required: true,
    },
    document: {
      type: Object as PropType<ResolvedDocument>,
      required: true,
    },
    catalog: {
      type: Object as PropType<MaterialCatalog>,
      required: true,
    },
    selectedNodeId: { type: String, default: undefined },
    hoveredNodeId: { type: String, default: undefined },
    dropDestination: {
      type: Object as PropType<StructuralDestination | null>,
      default: null,
    },
    dropRejectionCode: { type: String, default: undefined },
    execute: {
      type: Function as PropType<(action: AuthoringAction) => AuthoringResult>,
      default: undefined,
    },
    evaluate: {
      type: Function as PropType<(action: SchemaAuthoringAction) => AuthoringResult>,
      default: undefined,
    },
    onNodeDragStart: {
      type: Function as PropType<(event: DragEvent, nodeId: string) => void>,
      default: undefined,
    },
    onNodeDragEnd: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    diagnostics: {
      type: Object as PropType<PresentationDiagnosticRegistry>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n()
    return () => {
      const selectedRect = props.selectedNodeId
        ? props.geometry.rects.value.get(props.selectedNodeId)
        : undefined
      const selectedLocation = props.selectedNodeId
        ? props.document.locationsById.get(props.selectedNodeId)
        : undefined
      const selectedOwner = selectedLocation?.kind === 'container-region'
        ? {
            kind: 'container-region' as const,
            containerId: selectedLocation.containerId,
            regionId: selectedLocation.regionId,
          }
        : selectedLocation
          ? { kind: 'page-root' as const }
          : undefined
      const hoveredRect = props.hoveredNodeId && props.hoveredNodeId !== props.selectedNodeId
        ? props.geometry.rects.value.get(props.hoveredNodeId)
        : undefined
      const hoveredNode = props.hoveredNodeId
        ? props.document.nodesById.get(props.hoveredNodeId)
        : undefined
      const hoveredLocation = props.hoveredNodeId
        ? props.document.locationsById.get(props.hoveredNodeId)
        : undefined
      const hoveredRootContainerOwner = Boolean(
        hoveredNode?.state === 'resolved'
        && hoveredLocation?.kind === 'page-root'
        && props.hoveredNodeId
        && props.document.containersById.has(props.hoveredNodeId),
      )
      const toolbarActions = props.selectedNodeId
        ? projectNodeToolbarActions({
            catalog: props.catalog,
            document: props.document,
            evaluate: props.evaluate,
            nodeId: props.selectedNodeId,
          }).filter(action => action.visible)
        : []
      const position = props.dropRejectionCode ? undefined : props.dropDestination?.position
      const dropRect = position?.kind === 'before' || position?.kind === 'after'
        ? props.geometry.rects.value.get(position.nodeId)
        : undefined
      const children = []
      if (hoveredRect && props.hoveredNodeId && props.execute) {
        const label = t('canvas.node-handle', '选中组件')
        children.push(h('button', {
          'type': 'button',
          'data-dc-component': 'node-handle',
          'data-dc-node-id': props.hoveredNodeId,
          'aria-label': label,
          'title': label,
          'style': {
            position: 'absolute',
            left: hoveredRootContainerOwner ? '0px' : `${hoveredRect.right - 32}px`,
            top: `${hoveredRect.top + 4}px`,
            transform: hoveredRootContainerOwner ? 'translateX(calc(-100% - 8px))' : undefined,
          },
          'onClick': () => props.execute?.({ type: 'select-node', nodeId: props.hoveredNodeId! }),
        }, [
          h('span', { 'data-dc-part': 'surface' }, [
            h('span', { 'data-dc-part': 'icon', 'aria-hidden': 'true' }, [h(IconComponent, { size: 12 })]),
          ]),
        ]))
      }
      if (selectedRect && props.selectedNodeId) {
        children.push(h('div', {
          'data-dc-component': 'node-selection',
          'data-dc-node-id': props.selectedNodeId,
          'data-dc-state': selectedOwner?.kind === 'page-root' ? 'root-segment' : 'material-bounds',
          'style': {
            position: 'absolute',
            left: `${selectedRect.left}px`,
            top: `${selectedRect.top}px`,
            width: `${selectedRect.width}px`,
            height: `${selectedRect.height}px`,
          },
        }, selectedOwner?.kind === 'page-root'
          ? [
              h('span', { 'data-dc-part': 'block-start-edge' }),
              h('span', { 'data-dc-part': 'inline-end-edge' }),
              h('span', { 'data-dc-part': 'block-end-edge' }),
              h('span', { 'data-dc-part': 'inline-start-edge' }),
            ]
          : undefined))
        if (props.execute && toolbarActions.length > 0) {
          const rootToolbar = selectedLocation?.kind === 'page-root'
          const regionToolbar = selectedLocation?.kind === 'container-region'
          const regionPlacement = selectedRect.top >= 42 ? 'top-end' : 'bottom-end'
          const toolbarActionNodes = toolbarActions.map((action) => {
            const definition = {
              'drag': { fallback: '拖拽排序', icon: IconDrag, key: 'action.drag' },
              'move-up': { fallback: '上移', icon: IconArrowUp, key: 'action.move-up' },
              'move-down': { fallback: '下移', icon: IconArrowDown, key: 'action.move-down' },
              'duplicate': { fallback: '复制', icon: IconCopy, key: 'action.duplicate' },
              'remove': { fallback: '删除', icon: IconDelete, key: 'action.delete' },
            }[action.name]
            const label = t(definition.key, definition.fallback)
            if (action.name === 'drag') {
              return h('div', {
                'data-dc-action': action.name,
                'data-dc-part': 'action',
                'draggable': !action.disabled,
                'aria-disabled': action.disabled ? 'true' : undefined,
                'aria-label': label,
                'title': label,
                'onDragstart': action.disabled
                  ? undefined
                  : (event: DragEvent) => props.onNodeDragStart?.(event, props.selectedNodeId!),
                'onDragend': action.disabled ? undefined : () => props.onNodeDragEnd?.(),
              }, [h(definition.icon)])
            }
            return h('button', {
              'type': 'button',
              'data-dc-action': action.name,
              'data-dc-part': 'action',
              'data-dc-state': action.name === 'remove' ? 'danger' : undefined,
              'aria-label': label,
              'title': label,
              'disabled': action.disabled,
              'onClick': action.disabled || !action.action
                ? undefined
                : () => props.execute?.(action.action!),
            }, [h(definition.icon)])
          })
          children.push(h('div', {
            'data-dc-component': 'node-toolbar',
            'data-dc-node-id': props.selectedNodeId,
            'data-orientation': rootToolbar ? 'vertical' : regionToolbar ? 'horizontal' : undefined,
            'data-placement': rootToolbar ? 'left-start' : regionToolbar ? regionPlacement : undefined,
            'style': {
              'position': 'absolute',
              'left': rootToolbar ? '0px' : regionToolbar ? undefined : `${selectedRect.right}px`,
              '--dc-internal-node-toolbar-anchor-inline-end': regionToolbar
                ? `${selectedRect.right}px`
                : undefined,
              'top': rootToolbar
                ? `clamp(8px, ${selectedRect.top}px, calc(100% - 158px))`
                : regionToolbar && regionPlacement === 'bottom-end'
                  ? `${selectedRect.bottom + 8}px`
                  : `${selectedRect.top}px`,
              'transform': rootToolbar
                ? 'translateX(calc(-100% - 8px))'
                : regionToolbar && regionPlacement === 'top-end'
                  ? 'translateY(calc(-100% - 8px))'
                  : undefined,
            },
          }, toolbarActionNodes))
        }
      }
      if (dropRect && position && (position.kind === 'before' || position.kind === 'after')) {
        children.push(h('div', {
          'data-dc-component': 'drop-indicator',
          'style': {
            position: 'absolute',
            left: `${dropRect.left}px`,
            top: `${position.kind === 'before' ? dropRect.top : dropRect.bottom}px`,
            width: `${dropRect.width}px`,
          },
        }))
      }
      else if (position?.kind === 'end' && props.dropDestination) {
        const owner = props.dropDestination.owner
        const siblings = owner.kind === 'page-root'
          ? props.document.root
          : props.document.containersById
            .get(owner.containerId)
            ?.regions
            .get(owner.regionId)
            ?.children ?? []
        const endRect = props.geometry.rects.value.get(siblings.at(-1)?.node.id ?? '')
        if (endRect) {
          children.push(h('div', {
            'data-dc-component': 'drop-indicator',
            'data-dc-state': 'end',
            'style': {
              position: 'absolute',
              left: `${endRect.left}px`,
              top: `${endRect.bottom}px`,
              width: `${endRect.width}px`,
            },
          }))
        }
        else if (owner.kind === 'page-root' && siblings.length === 0) {
          children.push(h('div', {
            'data-dc-component': 'drop-indicator',
            'data-dc-state': 'empty end',
            'style': {
              position: 'absolute',
              inset: '8px',
            },
          }))
        }
        else if (owner.kind === 'container-region' && siblings.length === 0) {
          const regionRect = props.geometry.getRegionRect(owner.containerId, owner.regionId)
          if (regionRect) {
            children.push(h('div', {
              'data-dc-component': 'drop-indicator',
              'data-dc-state': 'empty end',
              'style': {
                position: 'absolute',
                left: `${regionRect.left}px`,
                top: `${regionRect.top}px`,
                width: `${regionRect.width}px`,
                height: `${regionRect.height}px`,
              },
            }))
          }
        }
      }
      else if (position?.kind === 'start' && props.dropDestination) {
        const owner = props.dropDestination.owner
        const siblings = owner.kind === 'page-root'
          ? props.document.root
          : props.document.containersById
            .get(owner.containerId)
            ?.regions
            .get(owner.regionId)
            ?.children ?? []
        const startRect = props.geometry.rects.value.get(siblings[0]?.node.id ?? '')
        if (startRect) {
          children.push(h('div', {
            'data-dc-component': 'drop-indicator',
            'data-dc-state': 'start',
            'style': {
              position: 'absolute',
              left: `${startRect.left}px`,
              top: `${startRect.top}px`,
              width: `${startRect.width}px`,
            },
          }))
        }
      }
      for (const diagnostic of props.diagnostics.diagnostics.value) {
        children.push(h('div', {
          'role': 'status',
          'data-dc-component': 'presentation-diagnostic',
          'data-dc-presentation-diagnostic': diagnostic.code,
          'data-dc-diagnostic-node-id': diagnostic.nodeId,
          'data-dc-container-id': diagnostic.containerId,
          'data-dc-region-id': diagnostic.regionId,
        }))
      }
      if (props.dropRejectionCode) {
        children.push(h('div', {
          'data-dc-component': 'forbidden-overlay',
          'data-dc-rejection-code': props.dropRejectionCode,
        }, [
          h('span', { 'data-dc-part': 'text' }, t(
            'forbidden.default',
            '当前物料不满足创建条件，无法添加到画布',
          )),
        ]))
      }
      return h('div', {
        'data-dc-plane': 'interaction',
      }, children)
    }
  },
})
