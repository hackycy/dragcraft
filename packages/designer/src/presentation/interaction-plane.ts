import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { AuthoringAction, AuthoringResult } from '../authoring/types'
import type { GeometryRegistry } from './geometry-registry'
import type { PresentationDiagnosticRegistry } from './presentation-diagnostics'
import { IconArrowDown, IconArrowUp, IconCopy, IconDelete } from '@dragcraft/icons'
import { defineComponent, h } from 'vue'

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
    selectedNodeId: { type: String, default: undefined },
    dropDestination: {
      type: Object as PropType<StructuralDestination | null>,
      default: null,
    },
    execute: {
      type: Function as PropType<(action: AuthoringAction) => AuthoringResult>,
      default: undefined,
    },
    diagnostics: {
      type: Object as PropType<PresentationDiagnosticRegistry>,
      required: true,
    },
  },
  setup(props) {
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
      const selectedSiblings = selectedLocation?.kind === 'container-region'
        ? props.document.containersById
          .get(selectedLocation.containerId)
          ?.regions
          .get(selectedLocation.regionId)
          ?.children
        : selectedLocation
          ? props.document.root
          : undefined
      const previousNodeId = selectedLocation
        ? selectedSiblings?.[selectedLocation.index - 1]?.node.id
        : undefined
      const nextNodeId = selectedLocation
        ? selectedSiblings?.[selectedLocation.index + 1]?.node.id
        : undefined
      const position = props.dropDestination?.position
      const dropRect = position?.kind === 'before' || position?.kind === 'after'
        ? props.geometry.rects.value.get(position.nodeId)
        : undefined
      const children = []
      if (selectedRect && props.selectedNodeId) {
        children.push(h('div', {
          'data-dc-component': 'node-selection',
          'data-dc-node-id': props.selectedNodeId,
          'style': {
            position: 'absolute',
            left: `${selectedRect.left}px`,
            top: `${selectedRect.top}px`,
            width: `${selectedRect.width}px`,
            height: `${selectedRect.height}px`,
          },
        }))
        if (props.execute) {
          children.push(h('div', {
            'data-dc-component': 'node-toolbar',
            'data-dc-node-id': props.selectedNodeId,
            'style': {
              position: 'absolute',
              left: `${selectedRect.right}px`,
              top: `${selectedRect.top}px`,
            },
          }, [
            h('button', {
              'type': 'button',
              'data-dc-action': 'move-up',
              'data-dc-part': 'action',
              'aria-label': 'Move node up',
              'title': 'Move node up',
              'disabled': !selectedOwner || !previousNodeId,
              'onClick': () => {
                if (!selectedOwner || !previousNodeId)
                  return
                props.execute?.({
                  type: 'move-node',
                  nodeId: props.selectedNodeId!,
                  to: {
                    owner: selectedOwner,
                    position: { kind: 'before', nodeId: previousNodeId },
                  },
                })
              },
            }, [h(IconArrowUp)]),
            h('button', {
              'type': 'button',
              'data-dc-action': 'move-down',
              'data-dc-part': 'action',
              'aria-label': 'Move node down',
              'title': 'Move node down',
              'disabled': !selectedOwner || !nextNodeId,
              'onClick': () => {
                if (!selectedOwner || !nextNodeId)
                  return
                props.execute?.({
                  type: 'move-node',
                  nodeId: props.selectedNodeId!,
                  to: {
                    owner: selectedOwner,
                    position: { kind: 'after', nodeId: nextNodeId },
                  },
                })
              },
            }, [h(IconArrowDown)]),
            h('button', {
              'type': 'button',
              'data-dc-action': 'duplicate',
              'data-dc-part': 'action',
              'aria-label': 'Duplicate node',
              'title': 'Duplicate node',
              'disabled': !selectedOwner,
              'onClick': () => {
                if (!selectedOwner)
                  return
                props.execute?.({
                  type: 'duplicate-node',
                  nodeId: props.selectedNodeId!,
                  to: {
                    owner: selectedOwner,
                    position: { kind: 'after', nodeId: props.selectedNodeId! },
                  },
                })
              },
            }, [h(IconCopy)]),
            h('button', {
              'type': 'button',
              'data-dc-action': 'remove',
              'data-dc-part': 'action',
              'data-dc-state': 'danger',
              'aria-label': 'Remove node',
              'title': 'Remove node',
              'onClick': () => props.execute?.({
                type: 'remove-node',
                nodeId: props.selectedNodeId!,
              }),
            }, [h(IconDelete)]),
          ]))
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
      return h('div', {
        'data-dc-plane': 'interaction',
      }, children)
    }
  },
})
