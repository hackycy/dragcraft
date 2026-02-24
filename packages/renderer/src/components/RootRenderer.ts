import type { DesignerEngine } from '@dragcraft/core'
import type { PropType, Ref, VNode } from 'vue'
import type { ComponentMap, RendererExtensions } from '../types'
import { computed, defineComponent, h, provide } from 'vue'
import { createRendererContext } from '../context'
import { RENDERER_CONTEXT_KEY } from '../types'
import DefaultContainerShell from './DefaultContainerShell'
import DefaultDropIndicator from './DefaultDropIndicator'
import WidgetRenderer from './WidgetRenderer'

export default defineComponent({
  name: 'DcRootRenderer',

  props: {
    engine: {
      type: Object as PropType<DesignerEngine>,
      required: true,
    },
    componentMap: {
      type: Object as PropType<ComponentMap>,
      required: true,
    },
    extensions: {
      type: Object as PropType<RendererExtensions>,
      default: () => ({}),
    },
    dragOverNodeId: {
      type: Object as PropType<Ref<string | null>>,
      default: undefined,
    },
    dragOverIndex: {
      type: Object as PropType<Ref<number | null>>,
      default: undefined,
    },
  },

  setup(props) {
    // Create and provide context (stable for the renderer's lifetime)
    const ctx = createRendererContext({
      engine: props.engine,
      componentMap: props.componentMap,
      extensions: props.extensions,
      dragOverNodeId: props.dragOverNodeId,
    })
    provide(RENDERER_CONTEXT_KEY, ctx)

    // Resolve which container shell to use
    const ContainerShell = computed(
      () => props.extensions?.containerShell ?? DefaultContainerShell,
    )

    return () => {
      // Read schema.value to establish reactive dependency
      const schema = props.engine.store.schema.value
      const rootChildren = schema.root.children ?? []
      const isDragOver = props.dragOverNodeId?.value === 'root'

      // Resolve drop indicator component
      const DropIndicator = props.extensions?.dropIndicator ?? DefaultDropIndicator

      const childVNodes: VNode[] = rootChildren.map(child =>
        h(WidgetRenderer, { key: child.id, node: child }),
      )

      // Show drop indicator at the computed insertion index
      if (isDragOver) {
        const idx = props.dragOverIndex?.value
        if (idx != null && idx >= 0 && idx <= childVNodes.length) {
          childVNodes.splice(idx, 0, h(DropIndicator, { key: '__drop-indicator__' }))
        }
        else {
          childVNodes.push(h(DropIndicator, { key: '__drop-indicator__' }))
        }
      }

      // Empty state placeholder
      const isEmpty = rootChildren.length === 0 && !isDragOver

      return h(
        'div',
        {
          'class': 'dc-root-renderer',
          'data-node-id': 'root',
          'data-node-type': 'root',
        },
        [
          h(
            ContainerShell.value,
            { class: { 'dc-container-shell--empty': isEmpty } },
            {
              default: () => isEmpty
                ? [h('div', { class: 'dc-canvas-empty' }, '拖拽组件到这里')]
                : childVNodes,
            },
          ),
        ],
      )
    }
  },
})
