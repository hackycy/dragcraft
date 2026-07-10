import type { CreationBlockReason, DesignerEngine } from '@dragcraft/core'
import type { Component, PropType, Ref, VNode } from 'vue'
import type { NodeActionRegistry } from '../action-registry'
import type { ActionInterceptor } from '../action-runtime'
import type { RendererEventHooks } from '../event-hooks'
import type { ComponentMap, RendererExtensions } from '../types'
import { createLayoutPlan, DEFAULT_LAYOUT_REGION, DEFAULT_SORT_SCOPE } from '@dragcraft/core'
import { computed, defineComponent, h, provide } from 'vue'
import { createRendererContext } from '../context'
import { RENDERER_CONTEXT_KEY } from '../types'
import DefaultContainerShell from './DefaultContainerShell'
import DefaultDropIndicator from './DefaultDropIndicator'
import DefaultEmptyState from './DefaultEmptyState'
import DefaultForbiddenOverlay from './DefaultForbiddenOverlay'
import WidgetRenderer from './WidgetRenderer'

function handlesForbiddenOverlay(component: Component): boolean {
  return Boolean((component as Component & { __dcHandlesForbiddenOverlay?: boolean }).__dcHandlesForbiddenOverlay)
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
      interactionBoundary: props.interactionBoundary,
    })
    provide(RENDERER_CONTEXT_KEY, ctx)

    // Resolve which container shell to use
    const ContainerShell = computed(
      () => props.extensions?.containerShell ?? DefaultContainerShell,
    )

    const ForbiddenOverlay = computed(
      () => props.extensions?.forbiddenOverlay ?? DefaultForbiddenOverlay,
    )

    return () => {
      // Read schema.value to establish reactive dependency
      const schema = props.engine.store.schema.value
      const isDragOver = props.dragOverNodeId?.value === 'root'
      const plan = createLayoutPlan(schema, props.engine.registry)

      // Resolve drop indicator and empty state components
      const DropIndicator = props.extensions?.dropIndicator ?? DefaultDropIndicator
      const EmptyState = props.extensions?.emptyState ?? DefaultEmptyState

      const regionVNodes: Record<string, VNode[]> = {}
      for (const [region, entries] of plan.regions) {
        regionVNodes[region] = entries.map(entry =>
          h(WidgetRenderer, {
            'key': entry.node.id,
            'node': entry.node,
            'data-dc-layout-region': entry.layout.region,
          }),
        )
      }

      const chromeVNodes = plan.chrome.map(entry =>
        h(WidgetRenderer, {
          'key': entry.node.id,
          'node': entry.node,
          'data-dc-layout-placement': 'chrome',
        }),
      )

      const layerVNodes: Record<string, VNode[]> = {}
      for (const [layer, entries] of plan.layers) {
        layerVNodes[layer] = entries.map(entry =>
          h(WidgetRenderer, {
            'key': entry.node.id,
            'node': entry.node,
            'data-dc-layout-placement': 'layer',
          }),
        )
      }

      const contentVNodes = regionVNodes[DEFAULT_LAYOUT_REGION] ?? []

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
        const idx = props.dragOverIndex?.value
        const scopeLength = plan.sortScopes.get(DEFAULT_SORT_SCOPE)?.length ?? contentVNodes.length
        if (idx != null && idx >= 0 && idx <= scopeLength) {
          contentVNodes.splice(idx, 0, h(DropIndicator, { key: '__drop-indicator__' }))
        }
        else {
          contentVNodes.push(h(DropIndicator, { key: '__drop-indicator__' }))
        }
      }

      // Empty state placeholder (only when no children and not dragging)
      const isEmpty = (plan.sortScopes.get(DEFAULT_SORT_SCOPE)?.length ?? 0) === 0 && !isDragOver
      const ContainerShellComponent = ContainerShell.value
      const fallbackForbiddenOverlayVNode = forbiddenOverlayVNode && !handlesForbiddenOverlay(ContainerShellComponent)
        ? createForbiddenOverlayVNode()
        : null

      return h(
        'div',
        {
          'class': 'dc-root-renderer',
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
              schema,
              registry: props.engine.registry,
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
          fallbackForbiddenOverlayVNode,
        ],
      )
    }
  },
})
