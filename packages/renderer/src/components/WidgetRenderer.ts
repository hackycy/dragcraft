import type { SchemaNode } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { defineComponent, h, ref, Teleport } from 'vue'
import { useNodeActions } from '../composables/useNodeActions'
import { useNodeDrag } from '../composables/useNodeDrag'
import { useToolbarPosition } from '../composables/useToolbarPosition'
import { useWidgetNode } from '../composables/useWidgetNode'
import { useRendererContext } from '../context'
import DefaultNodeHandle from './DefaultNodeHandle'
import DefaultNodeMask from './DefaultNodeMask'
import DefaultNodeToolbar from './DefaultNodeToolbar'
import DefaultWidgetFallback from './DefaultWidgetFallback'

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

    // Composables extract all logic
    const widget = useWidgetNode(() => props.node, ctx)
    const { actions } = useNodeActions(() => props.node, ctx)
    const drag = useNodeDrag(() => props.node, ctx)

    // Element ref for toolbar fixed positioning (escapes overflow clipping)
    const nodeElRef = ref<HTMLElement | null>(null)
    const { position: toolbarPosition } = useToolbarPosition(nodeElRef, widget.state.isSelected, {
      maxRight: ctx.toolbarMaxRight,
    })

    return () => {
      // Read schema.value to establish reactive dependency
      void ctx.engine.store.schema.value

      const node = props.node

      // Resolve extension components with defaults
      const NodeMask = extensions.nodeMask ?? DefaultNodeMask
      const NodeHandle = extensions.nodeHandle ?? DefaultNodeHandle
      const NodeToolbar = extensions.nodeToolbar ?? DefaultNodeToolbar
      const WidgetFallback = extensions.widgetFallback ?? DefaultWidgetFallback

      // Resolve per-widget or global wrapper
      const NodeWrapper = widget.meta.value?.wrapper ?? extensions.nodeWrapper

      // Render widget content
      const widgetProps = { ...node.props }
      const widgetStyle = node.style ? { ...node.style } : undefined

      const innerContent = widget.resolvedComponent.value
        ? h(widget.resolvedComponent.value, widgetProps)
        : h(WidgetFallback, { nodeId: node.id, nodeType: node.type })

      // Assemble children
      const wrapperChildren: VNode[] = [innerContent]

      // MASK (mask=true): transparent overlay blocks widget interaction
      if (widget.useMask.value) {
        wrapperChildren.push(
          h(NodeMask, {
            nodeId: node.id,
            nodeType: node.type,
            onSelect: widget.handleSelect,
          }),
        )
      }

      // HANDLE (mask=false + selectable): small handle for selection
      if (!widget.useMask.value && widget.selectable.value) {
        wrapperChildren.push(
          h(NodeHandle, {
            nodeId: node.id,
            nodeType: node.type,
            onSelect: widget.handleSelect,
          }),
        )
      }

      // TOOLBAR (when selected): action-driven floating toolbar
      // Teleported to <body> to escape all ancestor overflow clipping.
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
        wrapperChildren.push(h(Teleport, { to: 'body' }, [toolbarVNode]))
      }

      // Build the core wrapper vnode
      const coreWrapper = h(
        'div',
        {
          'ref': nodeElRef,
          'class': widget.wrapperClasses.value,
          'style': widgetStyle,
          'data-node-id': node.id,
          'data-node-type': node.type,
          'onMouseenter': widget.handleMouseEnter,
          'onMouseleave': widget.handleMouseLeave,
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
