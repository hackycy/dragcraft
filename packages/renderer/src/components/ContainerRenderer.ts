import type { SchemaNode } from '@dragcraft/core'
import type { PropType, VNode } from 'vue'
import { defineComponent, h } from 'vue'
import { useNodeState } from '../composables/useNodeState'
import { useRendererContext } from '../context'
import DefaultDropIndicator from './DefaultDropIndicator'
import NodeRenderer from './NodeRenderer'

export default defineComponent({
  name: 'DcContainerRenderer',

  props: {
    node: {
      type: Object as PropType<SchemaNode>,
      required: true,
    },
  },

  setup(props) {
    const ctx = useRendererContext()
    const { engine, componentMap, extensions } = ctx
    const nodeState = useNodeState(() => props.node.id, ctx)

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation()
      engine.store.selectNode(props.node.id)
    }
    const handleMouseEnter = () => engine.store.hoverNode(props.node.id)
    const handleMouseLeave = () => engine.store.hoverNode(null)

    return (): VNode => {
      // Read schema.value to establish reactive dependency
      void engine.store.schema.value

      const node = props.node
      const children = node.children ?? []

      // Resolve container layout component (optional)
      const ContainerLayout = componentMap[node.type]

      // Resolve drop indicator component
      const DropIndicator = extensions.dropIndicator ?? DefaultDropIndicator

      // Build child VNodes
      const childVNodes: VNode[] = children.map(child =>
        h(NodeRenderer, { key: child.id, node: child }),
      )

      // Add drop indicator if this container is a drag target
      if (nodeState.isDragOver.value) {
        childVNodes.push(h(DropIndicator, { key: '__drop-indicator__' }))
      }

      // Spread node.style for correct VNode diffing
      const containerStyle = node.style ? { ...node.style } : undefined

      // Inner content: either a custom container component or raw children
      const innerContent: VNode | VNode[] = ContainerLayout
        ? h(
            ContainerLayout,
            { ...node.props },
            { default: () => childVNodes },
          )
        : childVNodes

      return h(
        'div',
        {
          'class': [
            'dc-node',
            'dc-node--container',
            { 'dc-container--empty': children.length === 0 },
            nodeState.interactionClasses.value,
          ],
          'style': containerStyle,
          'data-node-id': node.id,
          'data-node-type': node.type,
          'onClick': handleClick,
          'onMouseenter': handleMouseEnter,
          'onMouseleave': handleMouseLeave,
        },
        Array.isArray(innerContent) ? innerContent : [innerContent],
      )
    }
  },
})
