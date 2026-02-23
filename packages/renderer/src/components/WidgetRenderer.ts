import type { SchemaNode } from '@dragcraft/core'
import type { PropType } from 'vue'
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

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation()
      engine.store.selectNode(props.node.id)
    }
    const handleMouseEnter = () => engine.store.hoverNode(props.node.id)
    const handleMouseLeave = () => engine.store.hoverNode(null)

    return () => {
      // Read schema.value to establish reactive dependency
      // (core uses shallowRef + triggerRef for in-place mutations)
      void engine.store.schema.value

      const node = props.node
      const ResolvedComponent = componentMap[node.type]

      // Spread node.props to create a fresh snapshot for correct VNode diffing
      const widgetProps = { ...node.props }
      const widgetStyle = node.style ? { ...node.style } : undefined

      const innerContent = ResolvedComponent
        ? h(ResolvedComponent, widgetProps)
        : h(DefaultWidgetFallback, { nodeType: node.type })

      return h(
        'div',
        {
          'class': [
            'dc-node',
            'dc-node--widget',
            nodeState.interactionClasses.value,
          ],
          'style': widgetStyle,
          'data-node-id': node.id,
          'data-node-type': node.type,
          'onClick': handleClick,
          'onMouseenter': handleMouseEnter,
          'onMouseleave': handleMouseLeave,
        },
        [innerContent],
      )
    }
  },
})
