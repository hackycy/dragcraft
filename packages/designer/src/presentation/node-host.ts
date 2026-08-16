import type { PropType, VNode } from 'vue'
import type { NodeSelectionPlane } from './selection-presentation'
import type { NodeOwner, NodeStyle, StyleValueMap } from './semantic'
import type { PresentationNode } from './types'
import { computed, defineComponent, h, inject, provide, ref, Teleport } from 'vue'
import { CONTAINER_RUNTIME_CONTEXT_KEY, createContainerRuntime } from './container-runtime'
import { usePresentationContext } from './context'
import DefaultContainerFallback from './default-container-fallback'
import DefaultMaterialFallback from './default-material-fallback'
import DefaultNodeHandle from './default-node-handle'
import DefaultNodeMask from './default-node-mask'
import DefaultNodeSelection from './default-node-selection'
import DefaultNodeToolbar from './default-node-toolbar'
import { resolveContainerRegions } from './material-presentation'
import { MATERIAL_PREVIEW_CONTEXT_KEY } from './material-preview-context'
import { resolveNodeInteractionPresentation } from './node-interaction'
import { NODE_SELECTION_PLANE_KEY } from './selection-presentation'
import { normalizeStyleValueMap } from './semantic'
import { useMaterialNode } from './use-material-node'
import { useNodeActions } from './use-node-actions'
import { useNodeDrag } from './use-node-drag'
import { useNodeInteractionGeometry } from './use-node-interaction-geometry'
import { useNodeSelectionProjection } from './use-node-selection-projection'
import { useToolbarPosition } from './use-toolbar-position'

const NODE_SURFACE_SELECTOR = '[data-dc-node-surface]'
const TOOLBAR_BOUNDARY_SELECTOR = '[data-dc-toolbar-boundary]'
const OVERLAY_BOUNDARY_SELECTOR = '[data-dc-overlay-boundary]'
const CANVAS_INTERACTION_LAYER_SELECTOR = '[data-dc-canvas-interaction-layer]'

function createNodeMaterialPreviewContext(
  getNode: () => { id: string, type: string },
  ctx: ReturnType<typeof usePresentationContext>,
) {
  const nodeId = computed(() => getNode().id)
  const nodeType = computed(() => getNode().type)
  const updateStyle = (patch: NodeStyle) => ctx.session.execute({
    type: 'node.update',
    nodeId: nodeId.value,
    props: {},
    style: patch,
  })

  return {
    nodeId,
    nodeType,
    updateProps: (patch: Record<string, unknown>) => ctx.session.execute({
      type: 'node.update',
      nodeId: nodeId.value,
      props: patch,
    }),
    updateStyle,
    updateContainerStyle: (patch: StyleValueMap) => updateStyle({ container: patch }),
    updateContentStyle: (patch: StyleValueMap) => updateStyle({ content: patch }),
  }
}

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
 * NodeHost is a thin Presentation orchestration layer.
 *
 * Delegates all logic to composables (useMaterialNode, useNodeActions, useNodeDrag)
 * and renders via configurable extension components (nodeMask, nodeHandle,
 * nodeToolbar, materialFallback, nodeWrapper).
 */
export default defineComponent({
  name: 'DcNodeHost',

  props: {
    node: {
      type: Object as PropType<PresentationNode>,
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
    const ctx = usePresentationContext()
    provide(MATERIAL_PREVIEW_CONTEXT_KEY, createNodeMaterialPreviewContext(() => props.node, ctx))
    const containerRuntime = createContainerRuntime(() => props.node, ctx)

    // Composables extract all logic
    const widget = useMaterialNode(() => props.node, ctx)
    const { actions } = useNodeActions(() => props.node, ctx, () => props.owner)
    const drag = useNodeDrag(() => props.node, ctx)
    const interactionPresentation = resolveNodeInteractionPresentation(props.owner)
    const inheritedSelectionPlane = inject(NODE_SELECTION_PLANE_KEY, ref<NodeSelectionPlane>('content'))
    const subtreeSelectionPlane = computed(() => props.selectionPlane ?? inheritedSelectionPlane.value)
    const projectionPlane = computed<NodeSelectionPlane>(() =>
      props.owner.kind === 'root' ? 'root' : subtreeSelectionPlane.value,
    )
    provide(NODE_SELECTION_PLANE_KEY, subtreeSelectionPlane)

    const containerRegions = computed(() => resolveContainerRegions(ctx.session, props.node))
    const isResolvedContainer = computed(() => {
      if (containerRegions.value.length === 0 || !widget.resolvedComponent.value)
        return false
      return true
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
      viewScale: ctx.viewScale,
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
      // Read the session snapshot to establish the node revision dependency.
      void ctx.schema.value

      const node = props.node
      const interactionLayerTarget = resolveInteractionLayerTarget(nodeElRef.value)
      const placement = widget.layout.value.placement
      const isContainerOwned = props.owner.kind === 'container'
      const ownerKind = isContainerOwned ? 'container' : 'root'
      const resolvedContainer = isResolvedContainer.value

      // Render widget content
      const widgetProps = { ...node.props }
      const nodeStyle = node.style as Record<string, unknown> | undefined
      const wrapperStyle = normalizeStyleValueMap(nodeStyle?.container as Record<string, unknown> | undefined)
      let contentStyle = normalizeStyleValueMap(nodeStyle?.content as Record<string, unknown> | undefined)

      // When a blocking mask is active, disable pointer events on widget content
      // so clicks always reach the mask overlay regardless of widget z-index
      if (usesBlockingMask.value) {
        contentStyle = contentStyle ?? {}
        contentStyle.pointerEvents = 'none'
      }

      let innerContent: VNode
      if (ctx.session.materials.get(node.type)?.schema?.container && !resolvedContainer) {
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
        innerContent = h(DefaultMaterialFallback, {
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
            h(DefaultNodeSelection, {
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
          h(DefaultNodeMask, {
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
        const handleVNode = h(DefaultNodeHandle, {
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
      // back to <body> for standalone Presentation usage.
      // Note: the toolbar must remain visible during drag — hiding it (display:none
      // or removing from DOM) breaks the HTML5 DnD lifecycle because the browser
      // cancels the drag when the source element becomes invisible.
      if (widget.state.isSelected.value && actions.value.length > 0) {
        const toolbarVNode = h(DefaultNodeToolbar, {
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

      return coreWrapper
    }
  },
})
