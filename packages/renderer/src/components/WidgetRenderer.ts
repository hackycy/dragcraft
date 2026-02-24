import type { SchemaNode } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { CommandType } from '@dragcraft/core'
import { defineComponent, h } from 'vue'
import { useNodeState } from '../composables/useNodeState'
import { useRendererContext } from '../context'
import DefaultWidgetFallback from './DefaultWidgetFallback'

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
    const { engine, componentMap } = ctx
    const nodeState = useNodeState(() => props.node.id, ctx)

    const handleSelect = (e: MouseEvent) => {
      e.stopPropagation()
      engine.store.selectNode(props.node.id)
    }
    const handleMouseEnter = () => engine.store.hoverNode(props.node.id)
    const handleMouseLeave = () => engine.store.hoverNode(null)

    // Toolbar actions
    const handleDelete = (e: MouseEvent) => {
      e.stopPropagation()
      engine.execute({
        type: CommandType.REMOVE_NODE,
        payload: { nodeId: props.node.id },
      })
    }

    const handleMoveUp = (e: MouseEvent) => {
      e.stopPropagation()
      const children = engine.store.getRawSchema().root.children ?? []
      const currentIndex = children.findIndex(c => c.id === props.node.id)
      if (currentIndex > 0) {
        engine.execute({
          type: CommandType.MOVE_NODE,
          payload: { nodeId: props.node.id, index: currentIndex - 1 },
        })
      }
    }

    const handleMoveDown = (e: MouseEvent) => {
      e.stopPropagation()
      const children = engine.store.getRawSchema().root.children ?? []
      const currentIndex = children.findIndex(c => c.id === props.node.id)
      if (currentIndex >= 0 && currentIndex < children.length - 1) {
        engine.execute({
          type: CommandType.MOVE_NODE,
          payload: { nodeId: props.node.id, index: currentIndex + 1 },
        })
      }
    }

    return () => {
      // Read schema.value to establish reactive dependency
      void engine.store.schema.value

      const node = props.node
      const ResolvedComponent = componentMap[node.type]
      const widgetMeta = engine.registry.getWidget(node.type)
      const useMask = widgetMeta?.mask !== false // default true

      // Spread node.props to create a fresh snapshot for correct VNode diffing
      const widgetProps = { ...node.props }
      const widgetStyle = node.style ? { ...node.style } : undefined

      const innerContent = ResolvedComponent
        ? h(ResolvedComponent, widgetProps)
        : h(DefaultWidgetFallback, { nodeType: node.type })

      // Build children array for the wrapper
      const wrapperChildren: VNode[] = [innerContent]

      // MASK OVERLAY (when mask=true): transparent overlay blocks widget interaction
      if (useMask) {
        wrapperChildren.push(
          h('div', {
            class: 'dc-node__mask',
            onClick: handleSelect,
          }),
        )
      }

      // SELECTION HANDLE (when mask=false): small handle on hover for selection
      if (!useMask) {
        wrapperChildren.push(
          h('div', {
            class: 'dc-node__handle',
            onClick: handleSelect,
            title: '选中组件',
          }),
        )
      }

      // SELECTION TOOLBAR (when selected): floating actions on the right side
      if (nodeState.isSelected.value) {
        const children = engine.store.getRawSchema().root.children ?? []
        const currentIndex = children.findIndex(c => c.id === node.id)
        const isFirst = currentIndex === 0
        const isLast = currentIndex === children.length - 1

        wrapperChildren.push(
          h('div', { class: 'dc-node__toolbar' }, [
            h('button', {
              type: 'button',
              class: 'dc-node__toolbar-btn dc-node__toolbar-btn--up',
              title: '上移',
              disabled: isFirst,
              onClick: handleMoveUp,
            }, '\u2191'),
            h('button', {
              type: 'button',
              class: 'dc-node__toolbar-btn dc-node__toolbar-btn--down',
              title: '下移',
              disabled: isLast,
              onClick: handleMoveDown,
            }, '\u2193'),
            h('button', {
              type: 'button',
              class: 'dc-node__toolbar-btn dc-node__toolbar-btn--delete',
              title: '删除',
              onClick: handleDelete,
            }, '\u2715'),
          ]),
        )
      }

      return h(
        'div',
        {
          'class': [
            'dc-node',
            'dc-node--widget',
            {
              'dc-node--masked': useMask,
              'dc-node--unmasked': !useMask,
            },
            nodeState.interactionClasses.value,
          ],
          'style': widgetStyle,
          'data-node-id': node.id,
          'data-node-type': node.type,
          'onMouseenter': handleMouseEnter,
          'onMouseleave': handleMouseLeave,
        },
        wrapperChildren,
      )
    }
  },
})
