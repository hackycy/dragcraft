import type { ResolvedDocument, StructuralDestination } from '@dragcraft/core'
import type { PropType } from 'vue'
import type { MaterialCatalog } from '../materials/create-material-catalog'
import { defineComponent, h, provide, ref } from 'vue'
import { VIEWPORT_PLANE_TARGET_KEY } from './designer-viewport-portal'
import NodeHost from './node-host'

export default defineComponent({
  name: 'DcApplicationSurface',
  props: {
    document: {
      type: Object as PropType<ResolvedDocument>,
      required: true,
    },
    catalog: {
      type: Object as PropType<MaterialCatalog>,
      required: true,
    },
    onDropAnchor: {
      type: Function as PropType<(destination: StructuralDestination) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const viewportPlane = ref<HTMLElement | null>(null)
    provide(VIEWPORT_PLANE_TARGET_KEY, viewportPlane)
    const renderNode = (
      node: ResolvedDocument['root'][number],
      owner: { readonly kind: 'page-root' } | {
        readonly kind: 'container-region'
        readonly containerId: string
        readonly regionId: string
      },
    ) => h(NodeHost, {
      key: node.node.id,
      catalog: props.catalog,
      document: props.document,
      node,
      owner,
      onDropAnchor: props.onDropAnchor,
      renderNode,
    })

    return () => h('div', {
      'data-dc-component': 'application-surface',
    }, [
      h('div', {
        'data-dc-plane': 'document',
      }, props.document.root.map(node => renderNode(node, { kind: 'page-root' }))),
      h('div', {
        'ref': viewportPlane,
        'data-dc-plane': 'viewport',
      }),
      h('div', {
        'data-dc-plane': 'interaction',
      }),
    ])
  },
})
