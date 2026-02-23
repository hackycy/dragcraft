import type { DesignerEngine } from '@dragcraft/core'
import type { PropType, Ref } from 'vue'
import type { ComponentMap, RendererExtensions } from '../types'
import { computed, defineComponent, h, provide } from 'vue'
import { createRendererContext } from '../context'
import { RENDERER_CONTEXT_KEY } from '../types'
import DefaultContainerShell from './DefaultContainerShell'
import NodeRenderer from './NodeRenderer'

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
            null,
            {
              default: () =>
                rootChildren.map(child =>
                  h(NodeRenderer, { key: child.id, node: child }),
                ),
            },
          ),
        ],
      )
    }
  },
})
