import type { DocumentSchema, NodeDefinition } from '@dragcraft/designer'
import type { Component, PropType, VNodeChild } from 'vue'
import type { RuntimeLayoutEdge, RuntimeLayoutEntry } from './layout'
import type { RuntimeRegions, RuntimeRegistry } from './registry'
import { defineComponent, h } from 'vue'
import { createFrameworkLayerStyle, createRuntimeLayoutPlan } from './layout'

export const DefaultRuntimeFallback = defineComponent({
  name: 'GuideRuntimeFallback',
  props: {
    node: { type: Object as PropType<NodeDefinition>, required: true },
  },
  setup(props) {
    return () => h('p', {
      class: 'guide-runtime-fallback',
      role: 'status',
    }, `无法渲染物料 ${props.node.type}（${props.node.id}）`)
  },
})

export function createRuntimeNodeRenderer(
  registry: RuntimeRegistry,
  schema: DocumentSchema,
  fallback: Component = DefaultRuntimeFallback,
): (node: NodeDefinition) => VNodeChild {
  const nodesById = new Map(schema.nodes.map(node => [node.id, node]))
  const renderNode = (node: NodeDefinition): VNodeChild => {
    const definition = registry[node.type]
    const container = schema.structure.containers[node.id]
    let content: VNodeChild

    if (!definition || (container && definition.kind !== 'container')) {
      content = h(fallback, { node })
    }
    else if (definition.kind === 'container') {
      if (!container) {
        content = h(fallback, { node })
      }
      else {
        const regions = Object.fromEntries(
          Object.entries(container.regions).map(([regionId, childIds]) => [
            regionId,
            childIds.flatMap((childId) => {
              const child = nodesById.get(childId)
              return child ? [renderNode(child)] : []
            }),
          ]),
        ) as RuntimeRegions

        content = h(definition.component, {
          node,
          regions,
        })
      }
    }
    else {
      content = h(definition.component, {
        ...node.props,
        style: node.style?.content,
      })
    }

    return h('div', {
      'class': 'guide-runtime-node',
      'data-runtime-node-id': node.id,
      'data-runtime-node-type': node.type,
      'style': node.style?.container,
    }, [content])
  }

  return renderNode
}

function renderEntries(
  entries: RuntimeLayoutEntry[],
  renderNode: (node: NodeDefinition) => VNodeChild,
): VNodeChild[] {
  return entries.map(entry => renderNode(entry.node))
}

function chromeEntries(
  entries: RuntimeLayoutEntry[],
  edge: RuntimeLayoutEdge,
  fixed: boolean,
): RuntimeLayoutEntry[] {
  return entries.filter(entry => entry.placement.kind === 'chrome'
    && entry.placement.edge === edge
    && (entry.placement.position === 'fixed') === fixed)
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
      const plan = createRuntimeLayoutPlan(props.schema, props.registry)
      const renderNode = createRuntimeNodeRenderer(props.registry, props.schema, props.fallback)
      const flowRegions = [...plan.flow.entries()].map(([regionId, entries]) => h('section', {
        'class': 'guide-runtime-region',
        'data-runtime-region': regionId,
      }, renderEntries(entries, renderNode)))
      const renderChrome = (edge: RuntimeLayoutEdge, fixed: boolean) => {
        const entries = chromeEntries(plan.chrome, edge, fixed)
        return entries.length === 0
          ? null
          : h('div', {
              'class': {
                'guide-runtime-edge': true,
                'guide-runtime-edge--fixed': fixed,
              },
              'data-runtime-edge': edge,
            }, renderEntries(entries, renderNode))
      }
      const layerVNodes = [...plan.layers.entries()].flatMap(([layer, entries]) => entries.map((entry) => {
        if (entry.placement.kind !== 'layer')
          return null
        return h('div', {
          'class': 'guide-runtime-overlay-entry',
          'data-runtime-overlay': layer,
          'data-runtime-overlay-mode': entry.placement.mode,
          'style': createFrameworkLayerStyle(entry.placement),
        }, [renderNode(entry.node)])
      }))

      return h('main', {
        class: 'guide-runtime-page',
        style: {
          '--guide-runtime-inset-block-start': plan.insets['block-start'],
          '--guide-runtime-inset-block-end': plan.insets['block-end'],
          '--guide-runtime-inset-inline-start': plan.insets['inline-start'],
          '--guide-runtime-inset-inline-end': plan.insets['inline-end'],
        },
      }, [
        h('div', { class: 'guide-runtime-scrollport' }, [
          h('div', {
            class: 'guide-runtime-surface',
            style: props.schema.page.style?.surface,
          }, [
            renderChrome('block-start', false),
            h('div', { class: 'guide-runtime-inline-layout' }, [
              renderChrome('inline-start', false),
              h('div', { class: 'guide-runtime-content' }, flowRegions),
              renderChrome('inline-end', false),
            ]),
            renderChrome('block-end', false),
          ]),
        ]),
        renderChrome('block-start', true),
        renderChrome('block-end', true),
        renderChrome('inline-start', true),
        renderChrome('inline-end', true),
        h('div', { class: 'guide-runtime-overlays' }, layerVNodes),
      ])
    }
  },
})
