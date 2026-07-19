import type { NodeOwner, SchemaNode } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import type { NodeSelectionPlane } from '../selection-presentation'
import { createContainerPlan, normalizeStyleValueMap } from '@dragcraft/core'
import { computed, defineComponent, h, inject, provide, ref, Teleport } from 'vue'
import { useNodeActions } from '../composables/useNodeActions'
import { useNodeDrag } from '../composables/useNodeDrag'
import { useNodeInteractionGeometry } from '../composables/useNodeInteractionGeometry'
import { useNodeSelectionProjection } from '../composables/useNodeSelectionProjection'
import { useToolbarPosition } from '../composables/useToolbarPosition'
import { useWidgetNode } from '../composables/useWidgetNode'
import { CONTAINER_RUNTIME_CONTEXT_KEY, createContainerRuntime } from '../container-runtime'
import { useRendererContext } from '../context'
import { resolveNodeInteractionPresentation } from '../node-interaction'
import { NODE_SELECTION_PLANE_KEY } from '../selection-presentation'
import { createWidgetRuntimeContext, WIDGET_RUNTIME_CONTEXT_KEY } from '../widget-runtime'
import DefaultContainerFallback from './DefaultContainerFallback'
import DefaultNodeHandle from './DefaultNodeHandle'
import DefaultNodeMask from './DefaultNodeMask'
import DefaultNodeSelection from './DefaultNodeSelection'
import DefaultNodeToolbar from './DefaultNodeToolbar'
import DefaultWidgetFallback from './DefaultWidgetFallback'

const NODE_SURFACE_SELECTOR = '[data-dc-node-surface]'
const TOOLBAR_BOUNDARY_SELECTOR = '[data-dc-toolbar-boundary]'
const OVERLAY_BOUNDARY_SELECTOR = '[data-dc-overlay-boundary]'
const CANVAS_INTERACTION_LAYER_SELECTOR = '[data-dc-canvas-interaction-layer]'

const ContainerRuntimeProvider = defineComponent({
  name: 'DcContainerRuntimeProvider',
  props: {
    runtime: {
      type: Object as PropType<ReturnType<typeof createContainerRuntime>>,
      required: true,
    },
  },
  setup(props, { slots }) {
    provide(CONTAINER_RUNTIME_CONTEXT_KEY, props.runtime)
    return () => slots.default?.()
  },
})

function resolveInteractionLayerTarget(host: HTMLElement | null): HTMLElement | string {
  if (typeof document === 'undefined')
    return 'body'
  return host?.closest('.dc-canvas')?.querySelector<HTMLElement>(CANVAS_INTERACTION_LAYER_SELECTOR) ?? 'body'
}

/**
 * WidgetRenderer — thin orchestration layer.
 *
 * Delegates all logic to composables (useWidgetNode, useNodeActions, useNodeDrag)
 * and renders via configurable extension components (nodeMask, nodeHandle,
 * nodeToolbar, widgetFallback, nodeWrapper).
 */
export default defineComponent({
  name: 'DcWidgetRenderer',

  props: {
    node: {
      type: Object as PropType<SchemaNode>,
      required: true,
    },
    owner: {
      type: Object as PropType<NodeOwner>,
      default: () => ({ kind: 'root' }),
    },
    selectionPlane: {
      type: String as PropType<NodeSelectionPlane>,
      default: undefined,
    },
  },

  setup(props) {
    const ctx = useRendererContext()
    const { extensions } = ctx
    provide(WIDGET_RUNTIME_CONTEXT_KEY, createWidgetRuntimeContext(() => props.node))
    const containerRuntime = createContainerRuntime(() => props.node, ctx)

    // Composables extract all logic
    const widget = useWidgetNode(() => props.node, ctx)
    const { actions } = useNodeActions(() => props.node, ctx, () => props.owner)
    const drag = useNodeDrag(() => props.node, ctx)
    const interactionPresentation = resolveNodeInteractionPresentation(props.owner)
    const inheritedSelectionPlane = inject(NODE_SELECTION_PLANE_KEY, ref<NodeSelectionPlane>('content'))
    const subtreeSelectionPlane = computed(() => props.selectionPlane ?? inheritedSelectionPlane.value)
    const projectionPlane = computed<NodeSelectionPlane>(() =>
      props.owner.kind === 'root' ? 'root' : subtreeSelectionPlane.value,
    )
    provide(NODE_SELECTION_PLANE_KEY, subtreeSelectionPlane)

    const containerPlan = computed(() => props.node.container
      ? createContainerPlan(props.node, ctx.engine.registry)
      : null)
    const isResolvedContainer = computed(() => {
      const plan = containerPlan.value
      if (plan?.ok !== true || !widget.resolvedComponent.value)
        return false
      const declaredRegionIds = new Set(plan.plan.variant.regions.map(region => region.id))
      return Object.keys(props.node.container?.regions ?? {}).every(regionId => declaredRegionIds.has(regionId))
    })
    const isSelfPositionedLayer = computed(() => {
      if (props.owner.kind === 'container')
        return false
      const placement = widget.layout.value.placement
      return placement.kind === 'layer' && placement.mode === 'self'
    })
    const usesBlockingMask = computed(() =>
      widget.useMask.value && !isSelfPositionedLayer.value && !isResolvedContainer.value,
    )
    const usesSelectionHandle = computed(() =>
      !usesBlockingMask.value && widget.selectable.value && !isSelfPositionedLayer.value,
    )

    // Element ref for toolbar fixed positioning (escapes overflow clipping)
    const nodeElRef = ref<HTMLElement | null>(null)
    const toolbarElRef = ref<HTMLElement | null>(null)
    const handleAnchorElRef = ref<HTMLElement | null>(null)
    const isExternalHandleActive = computed(() =>
      isResolvedContainer.value
      && usesSelectionHandle.value
      && !widget.state.isSelected.value,
    )
    const {
      geometry: interactionGeometry,
      update: updateInteractionGeometry,
    } = useNodeInteractionGeometry(nodeElRef, widget.state.isSelected, {
      mode: interactionPresentation.geometryMode,
      boundarySelector: OVERLAY_BOUNDARY_SELECTOR,
      selfTargetSelector: NODE_SURFACE_SELECTOR,
    })
    const {
      projection: selectionProjection,
      target: selectionTarget,
    } = useNodeSelectionProjection(nodeElRef, widget.state.isSelected, {
      kind: interactionPresentation.selectionKind,
      plane: projectionPlane,
      selfTargetSelector: NODE_SURFACE_SELECTOR,
    })
    const { position: toolbarPosition } = useToolbarPosition(nodeElRef, toolbarElRef, widget.state.isSelected, {
      interactionBoundary: ctx.interactionBoundary,
      interactionGeometry,
      interactionGeometryUpdate: updateInteractionGeometry,
      selfTargetSelector: NODE_SURFACE_SELECTOR,
      boundarySelector: TOOLBAR_BOUNDARY_SELECTOR,
      placement: interactionPresentation.toolbarPlacement,
      orientation: interactionPresentation.toolbarOrientation,
    })
    const {
      geometry: handleGeometry,
      update: updateHandleGeometry,
    } = useNodeInteractionGeometry(nodeElRef, isExternalHandleActive, {
      mode: 'node-box',
      boundarySelector: OVERLAY_BOUNDARY_SELECTOR,
    })
    const { position: handlePosition } = useToolbarPosition(nodeElRef, handleAnchorElRef, isExternalHandleActive, {
      interactionBoundary: ctx.interactionBoundary,
      interactionGeometry: handleGeometry,
      interactionGeometryUpdate: updateHandleGeometry,
      boundarySelector: TOOLBAR_BOUNDARY_SELECTOR,
      placement: 'left-start',
      orientation: 'vertical',
    })

    function isDirectNodeHit(event: MouseEvent): boolean {
      const target = event.target
      return target instanceof Element
        && target.closest<HTMLElement>('[data-node-id]') === event.currentTarget
    }

    function handleDirectSelect(event: MouseEvent): void {
      if (isDirectNodeHit(event))
        widget.handleSelect(event)
    }

    function handleMouseOver(event: MouseEvent): void {
      if (isDirectNodeHit(event))
        widget.handleMouseEnter()
    }

    return () => {
      // Read schema.value to establish reactive dependency
      void ctx.engine.store.schema.value

      const node = props.node
      const interactionLayerTarget = resolveInteractionLayerTarget(nodeElRef.value)
      const placement = widget.layout.value.placement
      const isContainerOwned = props.owner.kind === 'container'
      const ownerKind = isContainerOwned ? 'container' : 'root'
      const resolvedContainer = isResolvedContainer.value

      // Resolve extension components with defaults
      const NodeMask = extensions.nodeMask ?? DefaultNodeMask
      const NodeHandle = extensions.nodeHandle ?? DefaultNodeHandle
      const NodeToolbar = extensions.nodeToolbar ?? DefaultNodeToolbar
      const NodeSelection = extensions.nodeSelection ?? DefaultNodeSelection
      const WidgetFallback = extensions.widgetFallback ?? DefaultWidgetFallback

      // Resolve per-widget or global wrapper
      const NodeWrapper = widget.meta.value?.wrapper ?? extensions.nodeWrapper

      // Render widget content
      const widgetProps = { ...node.props }
      const wrapperStyle = normalizeStyleValueMap(node.style?.container)
      let contentStyle = normalizeStyleValueMap(node.style?.content)

      // When a blocking mask is active, disable pointer events on widget content
      // so clicks always reach the mask overlay regardless of widget z-index
      if (usesBlockingMask.value) {
        contentStyle = contentStyle ?? {}
        contentStyle.pointerEvents = 'none'
      }

      let innerContent: VNode
      if (node.container && !resolvedContainer) {
        innerContent = h(DefaultContainerFallback, { node })
      }
      else if (widget.resolvedComponent.value) {
        const material = h(widget.resolvedComponent.value, {
          ...widgetProps,
          'style': contentStyle,
          'data-dc-node-surface': '',
        })
        innerContent = resolvedContainer
          ? h(ContainerRuntimeProvider, { runtime: containerRuntime }, { default: () => material })
          : material
      }
      else {
        innerContent = h(WidgetFallback, {
          'nodeId': node.id,
          'nodeType': node.type,
          'data-dc-node-surface': '',
        })
      }

      // Assemble children
      const wrapperChildren: VNode[] = [innerContent]

      if (selectionProjection.value && selectionTarget.value) {
        const projection = selectionProjection.value
        wrapperChildren.push(h(Teleport, { to: selectionTarget.value }, [
          h('div', {
            'class': [
              'dc-node__selection-projection',
              `dc-node__selection-projection--${projection.kind}`,
              `dc-node__selection-projection--${ownerKind}-owned`,
            ],
            'data-node-id': node.id,
            'data-node-type': node.type,
            'data-dc-selection-plane': projection.plane,
            'style': {
              top: `${projection.bounds.top}px`,
              left: `${projection.bounds.left}px`,
              width: `${projection.bounds.width}px`,
              height: `${projection.bounds.height}px`,
            },
          }, [
            h(NodeSelection, {
              nodeId: node.id,
              nodeType: node.type,
              owner: props.owner,
              projection,
            }),
          ]),
        ]))
      }

      // MASK (mask=true): transparent overlay blocks widget interaction.
      // Self-positioned layer hosts span the viewport, so they select from the
      // material hit target instead of rendering a viewport-sized mask.
      if (usesBlockingMask.value) {
        wrapperChildren.push(
          h(NodeMask, {
            nodeId: node.id,
            nodeType: node.type,
            owner: props.owner,
            onSelect: widget.handleSelect,
          }),
        )
      }

      // Resolved containers use the same external Frame-left placement as the
      // selected toolbar; other unmasked nodes keep the adapter inline so their
      // interaction model does not change.
      if (usesSelectionHandle.value && !widget.state.isSelected.value) {
        const handleVNode = h(NodeHandle, {
          nodeId: node.id,
          nodeType: node.type,
          owner: props.owner,
          onSelect: widget.handleSelect,
        })
        if (resolvedContainer) {
          const position = handlePosition.value
          wrapperChildren.push(h(Teleport, { to: interactionLayerTarget }, [
            h('div', {
              'ref': handleAnchorElRef,
              'class': [
                'dc-node__handle-anchor',
                { 'dc-node__handle-anchor--visible': position.visible },
              ],
              'data-dc-component': 'node-handle-anchor',
              'data-dc-state': position.visible ? 'visible' : 'hidden',
              'data-dc-node-handle-for': node.id,
              'style': {
                position: position.strategy,
                top: 0,
                left: 0,
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              },
            }, [handleVNode]),
          ]))
        }
        else {
          wrapperChildren.push(handleVNode)
        }
      }

      // TOOLBAR (when selected): action-driven floating toolbar.
      // Teleported to the designer interaction layer when present, falling
      // back to <body> for standalone renderer usage.
      // Note: the toolbar must remain visible during drag — hiding it (display:none
      // or removing from DOM) breaks the HTML5 DnD lifecycle because the browser
      // cancels the drag when the source element becomes invisible.
      if (widget.state.isSelected.value) {
        const toolbarVNode = h(NodeToolbar, {
          nodeId: node.id,
          nodeType: node.type,
          owner: props.owner,
          actions: actions.value,
          state: widget.state,
          toolbarPosition: toolbarPosition.value,
          onDragStart: drag.handleDragStart,
          onDragEnd: drag.handleDragEnd,
        })
        wrapperChildren.push(h(Teleport, { to: interactionLayerTarget }, [
          h('div', {
            'ref': toolbarElRef,
            'class': 'dc-node__toolbar-anchor',
            'data-placement': toolbarPosition.value.placement,
            'data-orientation': toolbarPosition.value.orientation,
            'style': {
              position: toolbarPosition.value.strategy,
              top: 0,
              left: 0,
              transform: `translate3d(${toolbarPosition.value.x}px, ${toolbarPosition.value.y}px, 0)`,
              visibility: toolbarPosition.value.visible ? 'visible' : 'hidden',
              pointerEvents: toolbarPosition.value.visible ? 'auto' : 'none',
            },
          }, [toolbarVNode]),
        ]))
      }

      // Build the core wrapper vnode. Container styles control the node's box
      // in its assigned placement; content styles are passed to the widget.
      const themeStates = [
        widget.useMask.value ? 'masked' : 'unmasked',
        !widget.selectable.value ? 'non-selectable' : null,
        widget.inSortScope.value && !widget.sortable.value ? 'locked' : null,
        !widget.inSortScope.value ? 'unsorted' : null,
        widget.isDragging.value ? 'dragging' : null,
        !widget.visible.value ? 'hidden' : null,
        widget.state.isSelected.value ? 'selected' : null,
        widget.state.isHovered.value ? 'hovered' : null,
        widget.state.isDragOver.value ? 'drag-over' : null,
        `${ownerKind}-owned`,
      ].filter(Boolean).join(' ')
      const coreWrapper = h(
        'div',
        {
          'ref': nodeElRef,
          'class': [widget.wrapperClasses.value, `dc-node--${ownerKind}-owned`],
          'data-dc-component': 'node',
          'data-dc-state': themeStates,
          'data-dc-node-owner': ownerKind,
          'style': wrapperStyle,
          'data-node-id': node.id,
          'data-node-type': node.type,
          'data-dc-layout-placement': isContainerOwned ? undefined : placement.kind,
          'data-dc-layer-mode': !isContainerOwned && placement.kind === 'layer' ? placement.mode : undefined,
          'data-dc-layout-region': isContainerOwned ? undefined : widget.layout.value.region,
          'data-dc-sort-scope': isContainerOwned || widget.layout.value.sortScope === false
            ? undefined
            : widget.layout.value.sortScope,
          'data-dc-visible': widget.visible.value ? undefined : 'false',
          'onMouseover': resolvedContainer ? undefined : handleMouseOver,
          'onMouseleave': resolvedContainer ? undefined : widget.handleMouseLeave,
          'onClick': isSelfPositionedLayer.value && widget.selectable.value
            ? widget.handleSelect
            : resolvedContainer && widget.selectable.value
              ? handleDirectSelect
              : undefined,
        },
        wrapperChildren,
      )

      // If nodeWrapper extension is provided, wrap the core content
      if (NodeWrapper) {
        return h(
          NodeWrapper,
          {
            nodeId: node.id,
            nodeType: node.type,
            owner: props.owner,
            state: widget.state,
            meta: widget.meta.value,
          },
          { default: () => coreWrapper },
        )
      }

      return coreWrapper
    }
  },
})
