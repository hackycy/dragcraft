import type { DesignerEngine, NodeDestination, PlacementDecision, SchemaNode } from '@dragcraft/core'
import type { PropType, Ref, VNode } from 'vue'
import type { NodeActionRegistry } from '../action-registry'
import type { ActionInterceptor } from '../action-runtime'
import type { RendererEventHooks } from '../event-hooks'
import type { ComponentMap, ContainerDropRejection, ContainerDropTarget, RendererExtensions, RendererLayoutEntry, RendererLayoutProjection, RendererSessionProjection } from '../types'
import { DEFAULT_LAYOUT_REGION, DEFAULT_SORT_SCOPE, normalizeStyleValueMap } from '@dragcraft/core'
import { computed, defineComponent, h, isRef, provide } from 'vue'
import { createRendererContext } from '../context'
import { createNodeSelectionPresentation, NODE_SELECTION_PRESENTATION_KEY } from '../selection-presentation'
import { RENDERER_CONTEXT_KEY } from '../types'
import CanvasSurface from './CanvasSurface'
import DefaultContainerShell from './DefaultContainerShell'
import DefaultDropIndicator from './DefaultDropIndicator'
import DefaultEmptyState from './DefaultEmptyState'
import DefaultForbiddenOverlay from './DefaultForbiddenOverlay'
import WidgetRenderer from './WidgetRenderer'

function regionEntryIndex(plan: RendererLayoutProjection, entry: RendererLayoutEntry): number {
  return (plan.regions.get(entry.layout.region ?? DEFAULT_LAYOUT_REGION) ?? [])
    .findIndex(candidate => candidate.node.id === entry.node.id)
}

function insertDropIndicator(
  regionVNodes: Record<string, VNode[]>,
  plan: RendererLayoutProjection,
  session: RendererSessionProjection,
  destination: NodeDestination | null | undefined,
  legacyIndex: number | null | undefined,
  indicator: VNode,
): void {
  if (destination?.kind === 'container')
    return

  const sortScope = destination === undefined
    ? DEFAULT_SORT_SCOPE
    : destination?.sortScope
  if (!sortScope)
    return

  const entries = plan.sortScopes.get(sortScope) ?? []
  const requestedIndex = destination?.index ?? legacyIndex
  const index = requestedIndex == null
    ? entries.length
    : Math.max(0, Math.min(requestedIndex, entries.length))

  const dragTarget = session.state.dragTarget.value
  const draggedEntry = dragTarget?.sourceNodeId
    ? plan.entries.find(entry => entry.node.id === dragTarget.sourceNodeId)
    : undefined
  const draggedLayout = !draggedEntry && dragTarget?.widgetType
    ? session.materials.resolveLayout({ id: '__drop-indicator__', type: dragTarget.widgetType, props: {} } as SchemaNode)
    : undefined
  const inferredRegion = draggedEntry?.layout.region
    ?? (draggedLayout?.placement.kind === 'flow' ? draggedLayout.region : undefined)
  const adjacentEntry = index < entries.length ? entries[index] : entries.at(-1)
  const region = inferredRegion ?? adjacentEntry?.layout.region ?? DEFAULT_LAYOUT_REGION
  const regionNodes = regionVNodes[region] ?? (regionVNodes[region] = [])
  const nextRegionEntry = entries.slice(index)
    .find(entry => (entry.layout.region ?? DEFAULT_LAYOUT_REGION) === region)
  const previousRegionEntry = entries.slice(0, index)
    .findLast(entry => (entry.layout.region ?? DEFAULT_LAYOUT_REGION) === region)
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
  name: 'DcRootRenderer',

  props: {
    engine: {
      type: Object as PropType<DesignerEngine>,
      required: true,
    },
    session: {
      type: Object as PropType<RendererSessionProjection>,
      required: true,
    },
    componentMap: {
      type: Object as PropType<ComponentMap>,
      required: true,
    },
    extensions: {
      type: Object as PropType<RendererExtensions>,
      default: () => ({}),
    },
    eventHooks: {
      type: Object as PropType<RendererEventHooks>,
      default: undefined,
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
  },

  setup(props) {
    // Create and provide context (stable for the renderer's lifetime)
    const ctx = createRendererContext({
      engine: props.engine,
      session: props.session,
      componentMap: props.componentMap,
      extensions: props.extensions,
      eventHooks: props.eventHooks,
      actionInterceptors: props.actionInterceptors,
      actionRegistry: props.actionRegistry,
      dragOverNodeId: props.dragOverNodeId,
      activeDestination: props.activeDestination,
      containerDropDecision: props.containerDropDecision,
      onContainerDragOver: props.onContainerDragOver,
      onContainerDragLeave: props.onContainerDragLeave,
      onContainerDrop: props.onContainerDrop,
      interactionBoundary: props.interactionBoundary,
    })
    provide(RENDERER_CONTEXT_KEY, ctx)
    const selectionPresentation = createNodeSelectionPresentation()
    provide(NODE_SELECTION_PRESENTATION_KEY, selectionPresentation)

    // Resolve which container shell to use
    const ContainerShell = computed(() => {
      const source = props.extensions?.containerShell
      return (isRef(source) ? source.value : source) ?? DefaultContainerShell
    })

    const ForbiddenOverlay = computed(
      () => props.extensions?.forbiddenOverlay ?? DefaultForbiddenOverlay,
    )

    return () => {
      const isDragOver = props.dragOverNodeId?.value === 'root'
      const plan = ctx.layout.value
      const root = ctx.session.document.root.value as SchemaNode

      // Resolve drop indicator and empty state components
      const DropIndicator = props.extensions?.dropIndicator ?? DefaultDropIndicator
      const EmptyState = props.extensions?.emptyState ?? DefaultEmptyState

      const regionVNodes: Record<string, VNode[]> = {}
      for (const [region, entries] of plan.regions) {
        regionVNodes[region] = entries.map(entry =>
          h(WidgetRenderer, {
            'key': entry.node.id,
            'node': entry.node as SchemaNode,
            'selectionPlane': 'content',
            'data-dc-layout-region': entry.layout.region,
          }),
        )
      }

      const chromeVNodes = plan.chrome.map(entry =>
        h(WidgetRenderer, {
          'key': entry.node.id,
          'node': entry.node as SchemaNode,
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
          h(WidgetRenderer, {
            'key': entry.node.id,
            'node': entry.node as SchemaNode,
            'selectionPlane': 'viewport',
            'data-dc-layout-placement': 'layer',
          }),
        )
      }

      // Show forbidden overlay or drop indicator at the computed insertion index
      const isForbidden = ctx.session.state.drag.isForbidden.value
      const createForbiddenOverlayVNode = () =>
        h(ForbiddenOverlay.value, {
          key: '__forbidden__',
          widgetType: ctx.session.state.dragTarget.value?.widgetType ?? '',
          reason: ctx.session.state.drag.forbiddenReason.value,
        })
      const forbiddenOverlayVNode = isDragOver && isForbidden
        ? createForbiddenOverlayVNode()
        : null

      if (isDragOver && !isForbidden) {
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
          'class': 'dc-root-renderer',
          'data-dc-component': 'root-renderer',
          'data-node-id': 'root',
          'data-node-type': 'root',
        },
        [
          h(
            'div',
            {
              'class': 'dc-renderer-frame-boundary',
              'data-dc-component': 'renderer-frame-boundary',
              'data-dc-toolbar-boundary': '',
            },
            [
              h(ContainerShellComponent, null, {
                default: () => h(CanvasSurface, {
                  isEmpty,
                  regionVNodes,
                  chromeVNodes,
                  layerVNodes,
                  layoutPlan: plan,
                  surfaceStyle: normalizeStyleValueMap(root.style?.surface),
                  selectionPresentation,
                }),
              }),
              h('div', {
                'ref': (element: unknown) => {
                  selectionPresentation.registerPlane('root', element instanceof HTMLElement ? element : null)
                },
                'class': 'dc-node-selection-plane dc-node-selection-plane--root',
                'data-dc-selection-plane': 'root',
                'aria-hidden': 'true',
              }),
              forbiddenOverlayVNode,
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
