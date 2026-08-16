import type { Component, PropType, Ref, VNode } from 'vue'
import type { DesignerSession } from '../session/types'
import type { NodeActionRegistry } from './action-registry'
import type { ActionInterceptor } from './action-runtime'
import type { NodeDestination, PlacementDecision } from './semantic'
import type { ContainerDropRejection, ContainerDropTarget, PresentationContext } from './types'
import { useI18n } from '@dragcraft/i18n'
import { computed, defineComponent, h, provide } from 'vue'
import CanvasSurface from './canvas-surface'
import { createPresentationContext } from './context'
import DefaultContainerShell from './default-container-shell'
import DefaultDropIndicator from './default-drop-indicator'
import DefaultEmptyState from './default-empty-state'
import DefaultForbiddenOverlay from './default-forbidden-overlay'
import { createNodeGeometryRegistry, provideNodeGeometryRegistry } from './geometry-registry'
import { resolveNodePresentation } from './material-presentation'
import NodeHost from './node-host'
import { createNodeSelectionPresentation, NODE_SELECTION_PRESENTATION_KEY } from './selection-presentation'
import { DEFAULT_LAYOUT_REGION, normalizeStyleValueMap } from './semantic'
import { PRESENTATION_CONTEXT_KEY } from './types'

type SurfaceProjection = PresentationContext['layout']['value']
type SurfaceEntry = SurfaceProjection['entries'][number]
function regionEntryIndex(plan: SurfaceProjection, entry: SurfaceEntry): number {
  return (plan.regions.get(entry.layout.region ?? DEFAULT_LAYOUT_REGION) ?? [])
    .findIndex(candidate => candidate.node.id === entry.node.id)
}

function insertDropIndicator(
  regionVNodes: Record<string, VNode[]>,
  plan: SurfaceProjection,
  session: DesignerSession,
  destination: NodeDestination | null | undefined,
  legacyIndex: number | null | undefined,
  indicator: VNode,
): void {
  if (destination?.kind === 'container')
    return

  const rootNodes = session.document.rootNodes.value
  const requestedIndex = destination?.index ?? legacyIndex
  const index = requestedIndex == null
    ? rootNodes.length
    : Math.max(0, Math.min(requestedIndex, rootNodes.length))
  const nextNodeId = rootNodes[index]?.id
  const previousNodeId = rootNodes[index - 1]?.id
  const nextEntry = nextNodeId
    ? plan.entries.find(entry => entry.node.id === nextNodeId)
    : undefined
  const previousEntry = previousNodeId
    ? plan.entries.find(entry => entry.node.id === previousNodeId)
    : undefined

  const dragTarget = session.state.dragTarget.value
  const draggedEntry = dragTarget?.sourceNodeId
    ? plan.entries.find(entry => entry.node.id === dragTarget.sourceNodeId)
    : undefined
  const draggedLayout = !draggedEntry && dragTarget?.widgetType
    ? resolveNodePresentation(session, { type: dragTarget.widgetType })
    : undefined
  const inferredRegion = draggedEntry?.layout.region
    ?? (draggedLayout?.placement.kind === 'flow' ? draggedLayout.region : undefined)
  const adjacentEntry = nextEntry ?? previousEntry
  const region = inferredRegion ?? adjacentEntry?.layout.region ?? DEFAULT_LAYOUT_REGION
  const regionNodes = regionVNodes[region] ?? (regionVNodes[region] = [])
  const nextRegionEntry = nextEntry?.layout.region === region ? nextEntry : undefined
  const previousRegionEntry = previousEntry?.layout.region === region ? previousEntry : undefined
  if (!nextRegionEntry && !previousRegionEntry) {
    regionNodes.push(indicator)
    return
  }

  const insertIndex = nextRegionEntry
    ? regionEntryIndex(plan, nextRegionEntry)
    : regionEntryIndex(plan, previousRegionEntry!) + 1
  regionNodes.splice(Math.max(0, insertIndex), 0, indicator)
}

export default defineComponent({
  name: 'DcApplicationSurface',

  props: {
    session: {
      type: Object as PropType<DesignerSession>,
      required: true,
    },
    containerShell: {
      type: [Object, Function] as PropType<Component>,
      default: () => ({}),
    },
    actionInterceptors: {
      type: Array as PropType<ActionInterceptor[]>,
      default: undefined,
    },
    actionRegistry: {
      type: Object as PropType<NodeActionRegistry>,
      default: undefined,
    },
    dragOverNodeId: {
      type: Object as PropType<Ref<string | null>>,
      default: undefined,
    },
    dragOverIndex: {
      type: Object as PropType<Ref<number | null>>,
      default: undefined,
    },
    activeDestination: {
      type: Object as PropType<Ref<NodeDestination | null>>,
      default: undefined,
    },
    containerDropDecision: {
      type: Object as PropType<Ref<PlacementDecision | null>>,
      default: undefined,
    },
    onContainerDragOver: {
      type: Function as PropType<(target: ContainerDropTarget | ContainerDropRejection) => void>,
      default: undefined,
    },
    onContainerDragLeave: {
      type: Function as PropType<(event: DragEvent) => void>,
      default: undefined,
    },
    onContainerDrop: {
      type: Function as PropType<(event: DragEvent) => void>,
      default: undefined,
    },
    interactionBoundary: {
      type: Object as PropType<Ref<HTMLElement | null>>,
      default: undefined,
    },
    viewScale: {
      type: Object as PropType<Ref<number>>,
      default: undefined,
    },
  },

  setup(props) {
    const { t } = useI18n()
    // Create and provide context for the Application Surface lifetime.
    const ctx = createPresentationContext({
      session: props.session,
      containerShell: props.containerShell,
      actionInterceptors: props.actionInterceptors,
      actionRegistry: props.actionRegistry,
      dragOverNodeId: props.dragOverNodeId,
      activeDestination: props.activeDestination,
      containerDropDecision: props.containerDropDecision,
      onContainerDragOver: props.onContainerDragOver,
      onContainerDragLeave: props.onContainerDragLeave,
      onContainerDrop: props.onContainerDrop,
      interactionBoundary: props.interactionBoundary,
      viewScale: props.viewScale,
    })
    provide(PRESENTATION_CONTEXT_KEY, ctx)
    const selectionPresentation = createNodeSelectionPresentation()
    provide(NODE_SELECTION_PRESENTATION_KEY, selectionPresentation)
    provideNodeGeometryRegistry(createNodeGeometryRegistry())

    // Resolve which container shell to use
    const ContainerShell = computed(() => {
      return props.containerShell ?? DefaultContainerShell
    })

    const ForbiddenOverlay = computed(
      () => DefaultForbiddenOverlay,
    )

    return () => {
      const isDragOver = props.dragOverNodeId?.value === 'root'
      const plan = ctx.layout.value
      const pageStyle = ctx.schema.value?.page.style as Record<string, unknown> | undefined

      // Resolve drop indicator and empty state components
      const DropIndicator = DefaultDropIndicator
      const EmptyState = DefaultEmptyState

      const regionVNodes: Record<string, VNode[]> = {}
      const NodeRenderer = NodeHost
      for (const [region, entries] of plan.regions) {
        regionVNodes[region] = entries.map(entry =>
          h(NodeRenderer, {
            'key': entry.node.id,
            'node': entry.node,
            'selectionPlane': 'content',
            'data-dc-layout-region': entry.layout.region,
          }),
        )
      }

      const chromeVNodes = plan.chrome.map(entry =>
        h(NodeRenderer, {
          'key': entry.node.id,
          'node': entry.node,
          'selectionPlane': entry.layout.placement.kind === 'chrome'
            && entry.layout.placement.position === 'fixed'
            ? 'viewport'
            : 'content',
          'data-dc-layout-placement': 'chrome',
        }),
      )

      const layerVNodes: Record<string, VNode[]> = {}
      for (const [layer, entries] of plan.layers) {
        layerVNodes[layer] = entries.map(entry =>
          h(NodeRenderer, {
            'key': entry.node.id,
            'node': entry.node,
            'selectionPlane': 'viewport',
            'data-dc-layout-placement': 'layer',
          }),
        )
      }

      // Show forbidden overlay or drop indicator at the computed insertion index
      const isForbidden = ctx.session.state.drag.isForbidden.value
      const dragTarget = ctx.session.state.dragTarget.value
      const isHeadlessMaterialDrag = dragTarget?.sourceNodeId === null
        && dragTarget.widgetType !== null
        && ctx.session.materials.get(dragTarget.widgetType)?.presentation.kind === 'headless'
      const headlessOverlayVNode = isHeadlessMaterialDrag
        && ctx.activeDestination.value !== null
        && !isForbidden
        ? h('div', {
            'class': 'dc-headless-drop-overlay',
            'data-dc-component': 'headless-drop-overlay',
            'role': 'status',
          }, [
            h('span', { 'data-dc-part': 'text' }, t('material.headless.drop', '松开即可添加页面配置，不会显示在画布中')),
          ])
        : null
      const createForbiddenOverlayVNode = () =>
        h(ForbiddenOverlay.value, {
          key: '__forbidden__',
          widgetType: ctx.session.state.dragTarget.value?.widgetType ?? '',
          reason: ctx.session.state.drag.forbiddenReason.value,
        })
      const forbiddenOverlayVNode = isDragOver && isForbidden
        ? createForbiddenOverlayVNode()
        : null

      if (isDragOver && !isForbidden && !isHeadlessMaterialDrag) {
        insertDropIndicator(
          regionVNodes,
          plan,
          ctx.session,
          ctx.activeDestination.value,
          props.dragOverIndex?.value,
          h(DropIndicator, { key: '__drop-indicator__' }),
        )
      }

      // Empty state placeholder (only when the schema has no rendered nodes and not dragging)
      const isEmpty = plan.entries.length === 0 && !isDragOver
      if (isEmpty)
        regionVNodes[DEFAULT_LAYOUT_REGION] = [h(EmptyState, { isDragOver: false })]

      const ContainerShellComponent = ContainerShell.value

      return h(
        'div',
        {
          'class': 'dc-application-surface',
          'data-dc-component': 'application-surface',
          'data-node-id': 'root',
          'data-node-type': 'root',
        },
        [
          h(
            'div',
            {
              'class': 'dc-presentation-frame-boundary',
              'data-dc-component': 'presentation-frame-boundary',
              'data-dc-toolbar-boundary': '',
            },
            [
              h(ContainerShellComponent, null, {
                default: () => [
                  h(CanvasSurface, {
                    isEmpty,
                    regionVNodes,
                    chromeVNodes,
                    layerVNodes,
                    layoutPlan: plan,
                    surfaceStyle: normalizeStyleValueMap(pageStyle?.surface as Record<string, unknown> | undefined),
                    selectionPresentation,
                    forbiddenOverlay: forbiddenOverlayVNode,
                    headlessOverlay: headlessOverlayVNode,
                  }),
                ],
              }),
              h('div', {
                'ref': (element: unknown) => {
                  selectionPresentation.registerPlane('root', element instanceof HTMLElement ? element : null)
                },
                'class': 'dc-node-selection-plane dc-node-selection-plane--root',
                'data-dc-selection-plane': 'root',
                'aria-hidden': 'true',
              }),
            ],
          ),
          h('div', {
            'ref': (element: unknown) => {
              selectionPresentation.registerFallback(element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--fallback',
            'data-dc-selection-plane': 'fallback',
            'aria-hidden': 'true',
          }),
        ],
      )
    }
  },
})
