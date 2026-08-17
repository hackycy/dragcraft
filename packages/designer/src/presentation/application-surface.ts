import type { Component, PropType, Ref, VNode } from 'vue'
import type { DesignerSession } from '../session/types'
import type { NodeActionRegistry } from './action-registry'
import type { ActionInterceptor } from './action-runtime'
import type { ContainerDropDecision, NodeDestination } from './semantic'
import type { ContainerDropRejection, ContainerDropTarget } from './types'
import { useI18n } from '@dragcraft/i18n'
import { computed, defineComponent, h, provide, ref } from 'vue'
import CanvasSurface from './canvas-surface'
import { createPresentationContext } from './context'
import DefaultContainerShell from './default-container-shell'
import DefaultDropIndicator from './default-drop-indicator'
import DefaultEmptyState from './default-empty-state'
import DefaultForbiddenOverlay from './default-forbidden-overlay'
import { createNodeGeometryRegistry, provideNodeGeometryRegistry } from './geometry-registry'
import NodeHost from './node-host'
import { createNodeSelectionPresentation, NODE_SELECTION_PRESENTATION_KEY } from './selection-presentation'
import { normalizeStyleValueMap } from './semantic'
import { createSurfaceReservationManager, SURFACE_RESERVATION_MANAGER_KEY, SURFACE_VIEWPORT_TARGET_KEY } from './surface-geometry'
import { PRESENTATION_CONTEXT_KEY } from './types'

function insertDropIndicator(
  rootVNodes: VNode[],
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
  rootVNodes.splice(index, 0, indicator)
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
      type: Object as PropType<Ref<ContainerDropDecision | null>>,
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
    const surfaceReservations = createSurfaceReservationManager()
    const viewportTarget = ref<HTMLElement | null>(null)
    // Create and provide context for the Application Surface lifetime.
    const ctx = createPresentationContext({
      session: props.session,
      surfaceReservations,
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
    provide(SURFACE_RESERVATION_MANAGER_KEY, surfaceReservations)
    provide(SURFACE_VIEWPORT_TARGET_KEY, viewportTarget)

    // Resolve which container shell to use
    const ContainerShell = computed(() => {
      return props.containerShell ?? DefaultContainerShell
    })

    const ForbiddenOverlay = computed(
      () => DefaultForbiddenOverlay,
    )

    return () => {
      const isDragOver = props.dragOverNodeId?.value === 'root'
      const rootNodes = ctx.session.document.rootNodes.value
      const pageStyle = ctx.schema.value?.page.style as Record<string, unknown> | undefined

      // Resolve drop indicator and empty state components
      const DropIndicator = DefaultDropIndicator
      const EmptyState = DefaultEmptyState

      const rootVNodes: VNode[] = rootNodes.map((node) => {
        const presentation = ctx.session.materials.get(node.type)?.presentation
        const nodeHost = h(NodeHost, {
          key: node.id,
          node,
          owner: { kind: 'root' },
        })
        return presentation?.kind === 'visual' && presentation.frame
          ? h(presentation.frame, { key: `${node.id}:frame` }, { default: () => nodeHost })
          : nodeHost
      })

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
          rootVNodes,
          ctx.session,
          ctx.activeDestination.value,
          props.dragOverIndex?.value,
          h(DropIndicator, { key: '__drop-indicator__' }),
        )
      }

      // Empty state placeholder (only when the schema has no rendered nodes and not dragging)
      const isEmpty = rootNodes.length === 0 && !isDragOver
      if (isEmpty)
        rootVNodes.push(h(EmptyState, { isDragOver: false }))

      const ContainerShellComponent = ContainerShell.value

      const insets = surfaceReservations.insets.value
      return h(
        'div',
        {
          'class': 'dc-application-surface',
          'data-dc-component': 'application-surface',
          'data-node-id': 'root',
          'data-node-type': 'root',
          'style': {
            '--dc-internal-surface-reservation-block-start': `${insets['block-start']}px`,
            '--dc-internal-surface-reservation-block-end': `${insets['block-end']}px`,
            '--dc-internal-surface-reservation-inline-start': `${insets['inline-start']}px`,
            '--dc-internal-surface-reservation-inline-end': `${insets['inline-end']}px`,
            '--dc-inset-block-start': `calc(var(--dc-safe-area-block-start, 0px) + ${insets['block-start']}px)`,
            '--dc-inset-block-end': `calc(var(--dc-safe-area-block-end, 0px) + ${insets['block-end']}px)`,
            '--dc-inset-inline-start': `calc(var(--dc-safe-area-inline-start, 0px) + ${insets['inline-start']}px)`,
            '--dc-inset-inline-end': `calc(var(--dc-safe-area-inline-end, 0px) + ${insets['inline-end']}px)`,
          },
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
                    rootVNodes,
                    surfaceStyle: normalizeStyleValueMap(pageStyle?.surface as Record<string, unknown> | undefined),
                    selectionPresentation,
                    viewportPlaneRef: viewportTarget,
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
