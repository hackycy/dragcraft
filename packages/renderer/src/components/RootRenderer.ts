import type { CreationBlockReason, DeepReadonly, DesignerEngine, DesignerSchema, LayoutNodeEntry, LayoutPlan, NodeDestination, PlacementDecision } from '@dragcraft/core'
import type { Component, PropType, Ref, VNode } from 'vue'
import type { NodeActionRegistry } from '../action-registry'
import type { ActionInterceptor } from '../action-runtime'
import type { RendererEventHooks } from '../event-hooks'
import type { ComponentMap, ContainerDropRejection, ContainerDropTarget, RendererExtensions } from '../types'
import { DEFAULT_LAYOUT_REGION, DEFAULT_SORT_SCOPE, resolveNodeLayout } from '@dragcraft/core'
import { computed, defineComponent, h, provide } from 'vue'
import { createRendererContext } from '../context'
import { createNodeSelectionPresentation, NODE_SELECTION_PRESENTATION_KEY } from '../selection-presentation'
import { normalizeStyle } from '../style-utils'
import { RENDERER_CONTEXT_KEY } from '../types'
import DefaultContainerShell from './DefaultContainerShell'
import DefaultDropIndicator from './DefaultDropIndicator'
import DefaultEmptyState from './DefaultEmptyState'
import DefaultForbiddenOverlay from './DefaultForbiddenOverlay'
import WidgetRenderer from './WidgetRenderer'

function handlesForbiddenOverlay(component: Component): boolean {
  return Boolean((component as Component & { __dcHandlesForbiddenOverlay?: boolean }).__dcHandlesForbiddenOverlay)
}

function regionEntryIndex(plan: LayoutPlan, entry: LayoutNodeEntry): number {
  return (plan.regions.get(entry.layout.region ?? DEFAULT_LAYOUT_REGION) ?? [])
    .findIndex(candidate => candidate.node.id === entry.node.id)
}

function insertDropIndicator(
  regionVNodes: Record<string, VNode[]>,
  plan: LayoutPlan,
  schema: DeepReadonly<DesignerSchema>,
  engine: DesignerEngine,
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

  const dragTarget = engine.store.dragTarget.value
  const draggedEntry = dragTarget?.sourceNodeId
    ? plan.entries.find(entry => entry.node.id === dragTarget.sourceNodeId)
    : undefined
  const draggedLayout = !draggedEntry && dragTarget?.widgetType
    ? resolveNodeLayout({ id: '__drop-indicator__', type: dragTarget.widgetType, props: {} }, engine.registry, schema as DesignerSchema)
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
    isForbidden: {
      type: Object as PropType<Ref<boolean>>,
      default: undefined,
    },
    forbiddenReason: {
      type: Object as PropType<Ref<CreationBlockReason | null>>,
      default: undefined,
    },
  },

  setup(props) {
    // Create and provide context (stable for the renderer's lifetime)
    const ctx = createRendererContext({
      engine: props.engine,
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
    const ContainerShell = computed(
      () => props.extensions?.containerShell ?? DefaultContainerShell,
    )

    const ForbiddenOverlay = computed(
      () => props.extensions?.forbiddenOverlay ?? DefaultForbiddenOverlay,
    )

    return () => {
      const schema = ctx.schema.value
      const isDragOver = props.dragOverNodeId?.value === 'root'
      const plan = ctx.layoutPlan.value

      // Resolve drop indicator and empty state components
      const DropIndicator = props.extensions?.dropIndicator ?? DefaultDropIndicator
      const EmptyState = props.extensions?.emptyState ?? DefaultEmptyState

      const regionVNodes: Record<string, VNode[]> = {}
      for (const [region, entries] of plan.regions) {
        regionVNodes[region] = entries.map(entry =>
          h(WidgetRenderer, {
            'key': entry.node.id,
            'node': entry.node,
            'selectionPlane': 'content',
            'data-dc-layout-region': entry.layout.region,
          }),
        )
      }

      const chromeVNodes = plan.chrome.map(entry =>
        h(WidgetRenderer, {
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
          h(WidgetRenderer, {
            'key': entry.node.id,
            'node': entry.node,
            'selectionPlane': 'viewport',
            'data-dc-layout-placement': 'layer',
          }),
        )
      }

      // Show forbidden overlay or drop indicator at the computed insertion index
      const isForbidden = props.isForbidden?.value ?? false
      const createForbiddenOverlayVNode = () =>
        h(ForbiddenOverlay.value, {
          key: '__forbidden__',
          widgetType: props.engine.store.dragTarget.value?.widgetType ?? '',
          reason: props.forbiddenReason?.value ?? null,
        })
      const forbiddenOverlayVNode = isDragOver && isForbidden
        ? createForbiddenOverlayVNode()
        : null

      if (isDragOver && !isForbidden) {
        insertDropIndicator(
          regionVNodes,
          plan,
          schema,
          props.engine,
          props.activeDestination?.value,
          props.dragOverIndex?.value,
          h(DropIndicator, { key: '__drop-indicator__' }),
        )
      }

      const contentVNodes = regionVNodes[DEFAULT_LAYOUT_REGION] ?? []

      // Empty state placeholder (only when the schema has no rendered nodes and not dragging)
      const isEmpty = plan.entries.length === 0 && !isDragOver
      const ContainerShellComponent = ContainerShell.value
      const fallbackForbiddenOverlayVNode = forbiddenOverlayVNode && !handlesForbiddenOverlay(ContainerShellComponent)
        ? createForbiddenOverlayVNode()
        : null

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
            ContainerShellComponent,
            {
              class: { 'dc-container-shell--empty': isEmpty },
              isEmpty,
              regionVNodes,
              chromeVNodes,
              layerVNodes,
              forbiddenOverlayVNode,
              layoutPlan: plan,
              surfaceStyle: normalizeStyle(schema.root.style?.surface),
              registry: props.engine.registry,
              selectionPresentation,
            },
            {
              default: () => {
                if (isEmpty)
                  return [h(EmptyState, { isDragOver: false })]
                return contentVNodes
              },
              ...Object.fromEntries(
                Object.entries(regionVNodes).map(([region, vnodes]) => [region, () => vnodes]),
              ),
            },
          ),
          h('div', {
            'ref': (element: unknown) => {
              selectionPresentation.registerFallback(element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--fallback',
            'data-dc-selection-plane': 'fallback',
            'aria-hidden': 'true',
          }),
          fallbackForbiddenOverlayVNode,
        ],
      )
    }
  },
})
