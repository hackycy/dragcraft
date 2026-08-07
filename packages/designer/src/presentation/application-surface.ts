import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { Component, PropType } from 'vue'
import type { AuthoringAction, AuthoringResult, SchemaAuthoringAction } from '../authoring/types'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import { useI18n } from '@dragcraft/i18n'
import { IconPlus } from '@dragcraft/icons'
import { defineComponent, h, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { VIEWPORT_PLANE_TARGET_KEY } from './designer-viewport-portal'
import { createGeometryRegistry, GEOMETRY_REGISTRY_KEY } from './geometry-registry'
import InteractionPlane from './interaction-plane'
import NodeHost from './node-host'
import {
  createPresentationDiagnosticRegistry,
  PRESENTATION_DIAGNOSTIC_REGISTRY_KEY,
} from './presentation-diagnostics'
import {
  createSurfaceReservationRegistry,
  SURFACE_RESERVATION_REGISTRY_KEY,
} from './surface-reservation'

export default defineComponent({
  name: 'DcApplicationSurface',
  props: {
    document: {
      type: Object as PropType<ResolvedDocument>,
      required: true,
    },
    catalog: {
      type: Object as PropType<MaterialCatalog>,
      required: true,
    },
    containerShell: {
      type: Object as PropType<Component>,
      default: undefined,
    },
    onDropAnchor: {
      type: Function as PropType<(destination: StructuralDestination) => void>,
      default: undefined,
    },
    onDrop: {
      type: Function as PropType<(event: DragEvent) => void>,
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
    execute: {
      type: Function as PropType<(action: AuthoringAction) => AuthoringResult>,
      default: undefined,
    },
    evaluate: {
      type: Function as PropType<(action: SchemaAuthoringAction) => AuthoringResult>,
      default: undefined,
    },
    selectedNodeId: { type: String, default: undefined },
    hoveredNodeId: { type: String, default: undefined },
    draggingNodeId: { type: String, default: undefined },
    dropRejectionCode: { type: String, default: undefined },
  },
  setup(props) {
    const { t } = useI18n()
    const surfaceElement = ref<HTMLElement | null>(null)
    const viewportPlane = ref<HTMLElement | null>(null)
    const dropDestination = ref<StructuralDestination | null>(null)
    const geometry = createGeometryRegistry()
    const diagnostics = createPresentationDiagnosticRegistry()
    const reservations = createSurfaceReservationRegistry(geometry)
    watch(
      () => props.document.root.map(node => node.node.id),
      nodeIds => reservations.setRootOrder(nodeIds),
      { immediate: true },
    )
    provide(VIEWPORT_PLANE_TARGET_KEY, viewportPlane)
    provide(GEOMETRY_REGISTRY_KEY, geometry)
    provide(PRESENTATION_DIAGNOSTIC_REGISTRY_KEY, diagnostics)
    provide(SURFACE_RESERVATION_REGISTRY_KEY, reservations)
    onMounted(() => geometry.setBoundary(surfaceElement.value))
    onBeforeUnmount(() => {
      reservations.dispose()
      geometry.dispose()
    })
    function reportDropAnchor(destination: StructuralDestination): void {
      dropDestination.value = destination
      props.onDropAnchor?.(destination)
    }

    function handleRootDragOver(event: DragEvent): void {
      event.preventDefault()
      const point = geometry.toSurfacePoint(event.clientX, event.clientY)
      const orderedRects = props.document.root.flatMap((node) => {
        const rect = geometry.rects.value.get(node.node.id)
        return rect ? [{ nodeId: node.node.id, rect }] : []
      })
      const next = orderedRects.find(({ rect }) => point.y < rect.top + rect.height / 2)
      const last = orderedRects.at(-1)
      reportDropAnchor({
        owner: { kind: 'page-root' },
        position: next
          ? { kind: 'before', nodeId: next.nodeId }
          : last
            ? { kind: 'after', nodeId: last.nodeId }
            : { kind: 'end' },
      })
    }

    function handleRootDragLeave(event: DragEvent): void {
      const nextTarget = event.relatedTarget
      if (nextTarget instanceof Node && event.currentTarget instanceof HTMLElement
        && event.currentTarget.contains(nextTarget)) {
        return
      }
      dropDestination.value = null
    }

    const renderNode = (
      node: ResolvedDocument['root'][number],
      owner: { readonly kind: 'page-root' } | {
        readonly kind: 'container-region'
        readonly containerId: string
        readonly regionId: string
      },
    ) => h(NodeHost, {
      key: node.node.id,
      catalog: props.catalog,
      document: props.document,
      node,
      owner,
      execute: props.execute,
      selected: props.selectedNodeId === node.node.id,
      hovered: props.hoveredNodeId === node.node.id,
      dragging: props.draggingNodeId === node.node.id,
      onDropAnchor: reportDropAnchor,
      renderNode,
    })

    return () => {
      const rootNodes = props.document.root.map(node => renderNode(node, { kind: 'page-root' }))
      const emptyState = rootNodes.length === 0 && !dropDestination.value && !props.dropRejectionCode
        ? h('div', {
            'data-dc-component': 'empty-state',
          }, [
            h('span', { 'data-dc-part': 'icon', 'aria-hidden': 'true' }, [h(IconPlus, { size: 32 })]),
            h('span', { 'data-dc-part': 'text' }, t('canvas.empty', '拖拽组件到这里')),
          ])
        : null
      const documentPlane = h('div', {
        'data-dc-plane': 'document',
        'onDragleave': handleRootDragLeave,
        'onDragover': handleRootDragOver,
        'onDrop': (event: DragEvent) => {
          dropDestination.value = null
          props.onDrop?.(event)
        },
      }, [emptyState, ...rootNodes])
      const viewport = h('div', {
        'ref': viewportPlane,
        'data-dc-plane': 'viewport',
      })
      const preview = props.containerShell
        ? h(props.containerShell, null, { default: () => [documentPlane, viewport] })
        : [documentPlane, viewport]
      return h('div', {
        'ref': surfaceElement,
        'data-dc-component': 'application-surface',
        'style': {
          '--dc-internal-application-surface-reservation-block-start': `${reservations.totals['block-start'].value}px`,
          '--dc-internal-application-surface-reservation-block-end': `${reservations.totals['block-end'].value}px`,
          '--dc-internal-application-surface-reservation-inline-start': `${reservations.totals['inline-start'].value}px`,
          '--dc-internal-application-surface-reservation-inline-end': `${reservations.totals['inline-end'].value}px`,
        },
      }, [preview, h(InteractionPlane, {
        document: props.document,
        diagnostics,
        catalog: props.catalog,
        geometry,
        dropDestination: dropDestination.value,
        dropRejectionCode: props.dropRejectionCode,
        execute: props.execute,
        evaluate: props.evaluate,
        hoveredNodeId: props.hoveredNodeId,
        onNodeDragStart: props.onNodeDragStart,
        onNodeDragEnd: props.onNodeDragEnd,
        selectedNodeId: props.selectedNodeId,
      })])
    }
  },
})
