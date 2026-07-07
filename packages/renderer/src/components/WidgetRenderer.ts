import type { SchemaNode } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { computed, defineComponent, h, provide, ref, Teleport } from 'vue'
import { useBlockOverlayGeometry } from '../composables/useBlockOverlayGeometry'
import { useNodeActions } from '../composables/useNodeActions'
import { useNodeDrag } from '../composables/useNodeDrag'
import { useToolbarPosition } from '../composables/useToolbarPosition'
import { useWidgetNode } from '../composables/useWidgetNode'
import { useRendererContext } from '../context'
import { normalizeStyle } from '../style-utils'
import { createWidgetRuntimeContext, WIDGET_RUNTIME_CONTEXT_KEY } from '../widget-runtime'
import DefaultNodeHandle from './DefaultNodeHandle'
import DefaultNodeMask from './DefaultNodeMask'
import DefaultNodeToolbar from './DefaultNodeToolbar'
import DefaultWidgetFallback from './DefaultWidgetFallback'

const NODE_SURFACE_SELECTOR = '[data-dc-node-surface]'
const TOOLBAR_BOUNDARY_SELECTOR = '[data-dc-toolbar-boundary]'
const OVERLAY_BOUNDARY_SELECTOR = '[data-dc-overlay-boundary]'
const DESIGNER_PORTAL_SELECTOR = '[data-dc-designer-portal]'

function resolveInteractionLayerTarget(): string {
  if (typeof document === 'undefined')
    return 'body'

  return document.querySelector(DESIGNER_PORTAL_SELECTOR)
    ? DESIGNER_PORTAL_SELECTOR
    : 'body'
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
  },

  setup(props) {
    const ctx = useRendererContext()
    const { extensions } = ctx
    provide(WIDGET_RUNTIME_CONTEXT_KEY, createWidgetRuntimeContext(() => props.node))

    // Composables extract all logic
    const widget = useWidgetNode(() => props.node, ctx)
    const { actions } = useNodeActions(() => props.node, ctx)
    const drag = useNodeDrag(() => props.node, ctx)

    // Element ref for toolbar fixed positioning (escapes overflow clipping)
    const nodeElRef = ref<HTMLElement | null>(null)
    const overlayActive = computed(() => widget.state.isSelected.value || widget.state.isHovered.value)
    const { geometry: overlayGeometry } = useBlockOverlayGeometry(nodeElRef, overlayActive, {
      boundarySelector: OVERLAY_BOUNDARY_SELECTOR,
      selfTargetSelector: NODE_SURFACE_SELECTOR,
    })
    const { position: toolbarPosition } = useToolbarPosition(nodeElRef, widget.state.isSelected, {
      maxRight: ctx.toolbarMaxRight,
      selfTargetSelector: NODE_SURFACE_SELECTOR,
      boundarySelector: TOOLBAR_BOUNDARY_SELECTOR,
    })

    return () => {
      // Read schema.value to establish reactive dependency
      void ctx.engine.store.schema.value

      const node = props.node
      const interactionLayerTarget = resolveInteractionLayerTarget()
      const placement = widget.layout.value.placement
      const isSelfPositionedLayer = placement.kind === 'layer' && placement.mode === 'self'
      const usesBlockingMask = widget.useMask.value && !isSelfPositionedLayer
      const usesSelectionHandle = !usesBlockingMask && widget.selectable.value && !isSelfPositionedLayer

      // Resolve extension components with defaults
      const NodeMask = extensions.nodeMask ?? DefaultNodeMask
      const NodeHandle = extensions.nodeHandle ?? DefaultNodeHandle
      const NodeToolbar = extensions.nodeToolbar ?? DefaultNodeToolbar
      const WidgetFallback = extensions.widgetFallback ?? DefaultWidgetFallback

      // Resolve per-widget or global wrapper
      const NodeWrapper = widget.meta.value?.wrapper ?? extensions.nodeWrapper

      // Render widget content
      const widgetProps = { ...node.props }
      const wrapperStyle = normalizeStyle(node.style?.container)
      let contentStyle = normalizeStyle(node.style?.content)

      // When a blocking mask is active, disable pointer events on widget content
      // so clicks always reach the mask overlay regardless of widget z-index
      if (usesBlockingMask) {
        contentStyle = contentStyle ?? {}
        contentStyle.pointerEvents = 'none'
      }

      const innerContent = widget.resolvedComponent.value
        ? h(widget.resolvedComponent.value, {
            ...widgetProps,
            'style': contentStyle,
            'data-dc-node-surface': '',
          })
        : h(WidgetFallback, {
            'nodeId': node.id,
            'nodeType': node.type,
            'data-dc-node-surface': '',
          })

      // Assemble children
      const wrapperChildren: VNode[] = [innerContent]

      if (overlayActive.value && overlayGeometry.value.visible) {
        wrapperChildren.push(h(Teleport, { to: interactionLayerTarget }, [
          h('div', {
            'class': [
              'dc-node__block-overlay',
              {
                'dc-node__block-overlay--selected': widget.state.isSelected.value,
                'dc-node__block-overlay--hovered': widget.state.isHovered.value && !widget.state.isSelected.value,
              },
            ],
            'data-node-id': node.id,
            'data-node-type': node.type,
            'style': {
              top: `${overlayGeometry.value.top}px`,
              left: `${overlayGeometry.value.left}px`,
              width: `${overlayGeometry.value.width}px`,
              height: `${overlayGeometry.value.height}px`,
            },
          }),
        ]))
      }

      // MASK (mask=true): transparent overlay blocks widget interaction.
      // Self-positioned layer hosts span the viewport, so they select from the
      // material hit target instead of rendering a viewport-sized mask.
      if (usesBlockingMask) {
        wrapperChildren.push(
          h(NodeMask, {
            nodeId: node.id,
            nodeType: node.type,
            onSelect: widget.handleSelect,
          }),
        )
      }

      // HANDLE (mask=false + selectable): small handle for selection
      if (usesSelectionHandle) {
        wrapperChildren.push(
          h(NodeHandle, {
            nodeId: node.id,
            nodeType: node.type,
            onSelect: widget.handleSelect,
          }),
        )
      }

      // TOOLBAR (when selected): action-driven floating toolbar.
      // Teleported to the designer interaction layer when present, falling
      // back to <body> for standalone renderer usage.
      // Note: the toolbar must remain visible during drag — hiding it (display:none
      // or removing from DOM) breaks the HTML5 DnD lifecycle because the browser
      // cancels the drag when the source element becomes invisible.
      if (widget.state.isSelected.value && toolbarPosition.value.visible) {
        const toolbarVNode = h(NodeToolbar, {
          nodeId: node.id,
          nodeType: node.type,
          actions: actions.value,
          state: widget.state,
          toolbarPosition: toolbarPosition.value,
          onDragStart: drag.handleDragStart,
          onDragEnd: drag.handleDragEnd,
        })
        wrapperChildren.push(h(Teleport, { to: interactionLayerTarget }, [toolbarVNode]))
      }

      // Build the core wrapper vnode. Container styles control the node's box
      // in its assigned placement; content styles are passed to the widget.
      const coreWrapper = h(
        'div',
        {
          'ref': nodeElRef,
          'class': widget.wrapperClasses.value,
          'style': wrapperStyle,
          'data-node-id': node.id,
          'data-node-type': node.type,
          'data-dc-layout-placement': placement.kind,
          'data-dc-layer-mode': placement.kind === 'layer' ? placement.mode : undefined,
          'data-dc-layout-region': widget.layout.value.region,
          'data-dc-sort-scope': widget.layout.value.sortScope === false ? undefined : widget.layout.value.sortScope,
          'data-dc-visible': widget.visible.value ? undefined : 'false',
          'onMouseenter': widget.handleMouseEnter,
          'onMouseleave': widget.handleMouseLeave,
          'onClick': isSelfPositionedLayer && widget.selectable.value ? widget.handleSelect : undefined,
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
