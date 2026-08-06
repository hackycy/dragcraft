import type { DocumentSchema, NodeDefinition } from '@dragcraft/designer'
import type { Component, PropType, VNodeChild } from 'vue'
import type { RuntimeMount, RuntimeRegions, RuntimeRegistry } from './registry'
import { defineComponent, h } from 'vue'

export const DefaultRuntimeFallback = defineComponent({
  name: 'GuideRuntimeFallback',
  props: { node: { type: Object as PropType<NodeDefinition>, required: true } },
  setup: props => () => h('p', {
    class: 'guide-runtime-fallback',
    role: 'status',
  }, `无法渲染物料 ${props.node.type}（${props.node.id}）`),
})

export interface RuntimeDocumentView {
  readonly document: readonly string[]
  readonly header: readonly string[]
  readonly overlay: readonly string[]
}

export function createRuntimeDocumentView(
  schema: DocumentSchema,
  registry: RuntimeRegistry,
): RuntimeDocumentView {
  const nodesById = new Map(schema.nodes.map(node => [node.id, node]))
  const groups: Record<RuntimeMount, string[]> = {
    document: [],
    header: [],
    overlay: [],
  }
  for (const nodeId of schema.structure.root) {
    const node = nodesById.get(nodeId)
    const mount = node ? registry[node.type]?.mount ?? 'document' : 'document'
    groups[mount].push(nodeId)
  }
  return groups
}

export function createRuntimeNodeRenderer(
  schema: DocumentSchema,
  registry: RuntimeRegistry,
  fallback: Component = DefaultRuntimeFallback,
): (nodeId: string) => VNodeChild {
  const nodesById = new Map(schema.nodes.map(node => [node.id, node]))

  const renderNode = (nodeId: string): VNodeChild => {
    const node = nodesById.get(nodeId)
    if (!node)
      return null
    const definition = registry[node.type]
    const structure = schema.structure.containers[node.id]
    let content: VNodeChild

    if (!definition || Boolean(structure) !== (definition.kind === 'container')) {
      content = h(fallback, { node })
    }
    else if (definition.kind === 'container' && structure) {
      const regions = Object.fromEntries(Object.entries(structure.regions).map(([regionId, childIds]) => [
        regionId,
        childIds.map(renderNode),
      ])) as RuntimeRegions
      content = h(definition.component, { node, regions })
    }
    else {
      content = h(definition.component, { ...node.props })
    }

    return h('div', {
      'class': 'guide-runtime-node',
      'data-runtime-node-id': node.id,
      'data-runtime-node-type': node.type,
      'style': node.style,
    }, [content])
  }
  return renderNode
}

export const RuntimePage = defineComponent({
  name: 'GuideRuntimePage',
  props: {
    schema: { type: Object as PropType<DocumentSchema>, required: true },
    registry: { type: Object as PropType<RuntimeRegistry>, required: true },
    fallback: { type: Object as PropType<Component>, default: () => DefaultRuntimeFallback },
  },
  setup(props) {
    return () => {
      const view = createRuntimeDocumentView(props.schema, props.registry)
      const renderNode = createRuntimeNodeRenderer(props.schema, props.registry, props.fallback)
      return h('main', { class: 'guide-runtime-page' }, [
        h('header', { class: 'guide-runtime-header' }, view.header.map(renderNode)),
        h('div', { class: 'guide-runtime-scrollport' }, [
          h('div', { class: 'guide-runtime-surface', style: props.schema.page.style }, view.document.map(renderNode)),
        ]),
        h('div', { class: 'guide-runtime-overlays' }, view.overlay.map(renderNode)),
      ])
    }
  },
})
