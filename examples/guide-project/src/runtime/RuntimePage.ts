import type { DesignerSchema, SchemaNode } from '@dragcraft/designer'
import type { Component, PropType, VNodeChild } from 'vue'
import { defineComponent, h } from 'vue'

export type RuntimeComponentMap = Record<string, Component>
export type RuntimeContainerMap = Record<string, Component>
export type RuntimeRegions = Record<string, VNodeChild[]>

// #region tutorial-runtime-renderer
export function createRuntimeNodeRenderer(
  componentMap: RuntimeComponentMap,
  containerMap: RuntimeContainerMap,
): (node: SchemaNode) => VNodeChild {
  const renderNode = (node: SchemaNode): VNodeChild => {
    if (node.container) {
      const Container = containerMap[node.type]
      if (!Container)
        return null

      const regions = Object.fromEntries(
        Object.entries(node.container.regions).map(([regionId, children]) => [
          regionId,
          children.map(renderNode),
        ]),
      ) as RuntimeRegions

      return h(Container, {
        node,
        variant: node.container.variant,
        regions,
      })
    }

    const Widget = componentMap[node.type]
    return Widget
      ? h('div', { class: 'guide-runtime-node', style: node.style?.container }, [
          h(Widget, { ...node.props, style: node.style?.content }),
        ])
      : null
  }

  return renderNode
}
// #endregion tutorial-runtime-renderer

export const RuntimePage = defineComponent({
  name: 'GuideRuntimePage',
  props: {
    schema: { type: Object as PropType<DesignerSchema>, required: true },
    componentMap: { type: Object as PropType<RuntimeComponentMap>, required: true },
    containerMap: { type: Object as PropType<RuntimeContainerMap>, required: true },
  },
  setup(props) {
    return () => {
      const renderNode = createRuntimeNodeRenderer(props.componentMap, props.containerMap)
      return h('main', {
        class: 'guide-runtime-page',
        style: props.schema.root.style?.surface,
      }, props.schema.root.children?.map(renderNode))
    }
  },
})
