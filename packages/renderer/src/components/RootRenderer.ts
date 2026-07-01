import type { DesignerEngine } from '@dragcraft/core'
import type { PropType, Ref, VNode } from 'vue'
import type { NodeActionRegistry } from '../action-registry'
import type { RendererEventHooks } from '../event-hooks'
import type { ComponentMap, RendererExtensions } from '../types'
import { computed, defineComponent, h, provide } from 'vue'
import { createRendererContext } from '../context'
import { RENDERER_CONTEXT_KEY } from '../types'
import DefaultContainerShell from './DefaultContainerShell'
import DefaultDropIndicator from './DefaultDropIndicator'
import DefaultEmptyState from './DefaultEmptyState'
import DefaultForbiddenOverlay from './DefaultForbiddenOverlay'
import WidgetRenderer from './WidgetRenderer'

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
    toolbarMaxRight: {
      type: Object as PropType<Ref<number | undefined>>,
      default: undefined,
    },
    isForbidden: {
      type: Object as PropType<Ref<boolean>>,
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
      actionRegistry: props.actionRegistry,
      dragOverNodeId: props.dragOverNodeId,
      toolbarMaxRight: props.toolbarMaxRight,
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
      const rootChildren = schema.root.children ?? []
      const isDragOver = props.dragOverNodeId?.value === 'root'

      // Resolve drop indicator and empty state components
      const DropIndicator = props.extensions?.dropIndicator ?? DefaultDropIndicator
      const EmptyState = props.extensions?.emptyState ?? DefaultEmptyState

      // Split into flow and overlay groups
      const flowChildren: typeof rootChildren = []
      const overlayChildren: typeof rootChildren = []
      for (const child of rootChildren) {
        const meta = props.engine.registry.getWidget(child.type)
        if (meta && meta.flow === false)
          overlayChildren.push(child)
        else
          flowChildren.push(child)
      }

      const flowVNodes: VNode[] = flowChildren.map(child =>
        h(WidgetRenderer, { key: child.id, node: child }),
      )

      // Show forbidden overlay or drop indicator at the computed insertion index
      const isForbidden = props.isForbidden?.value ?? false

      if (isDragOver && isForbidden) {
        flowVNodes.push(h(ForbiddenOverlay.value, {
          key: '__forbidden__',
          widgetType: props.engine.store.dragTarget.value?.widgetType ?? '',
        }))
      }
      else if (isDragOver) {
        const idx = props.dragOverIndex?.value
        if (idx != null && idx >= 0 && idx <= flowVNodes.length) {
          flowVNodes.splice(idx, 0, h(DropIndicator, { key: '__drop-indicator__' }))
        }
        else {
          flowVNodes.push(h(DropIndicator, { key: '__drop-indicator__' }))
        }
      }

      // Overlay layer VNodes
      const overlayVNodes: VNode[] = overlayChildren.map(child =>
        h(WidgetRenderer, { key: child.id, node: child }),
      )

      // Empty state placeholder (only when no flow children and not dragging)
      const isEmpty = flowChildren.length === 0 && !isDragOver

      return h(
        'div',
        {
          'class': 'dc-root-renderer',
          'data-node-id': 'root',
          'data-node-type': 'root',
        },
        [
          h(
            ContainerShell.value,
            { class: { 'dc-container-shell--empty': isEmpty } },
            {
              default: () => {
                if (isEmpty)
                  return [h(EmptyState, { isDragOver: false })]
                return [
                  h('div', { class: 'dc-canvas__flow' }, flowVNodes),
                  ...(overlayVNodes.length > 0
                    ? [h('div', { class: 'dc-canvas__overlay' }, overlayVNodes)]
                    : []),
                ]
              },
            },
          ),
        ],
      )
    }
  },
})
