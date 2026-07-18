import type { DesignerSchema } from '@dragcraft/core'
import type { Component, PropType, VNode } from 'vue'
import type { NodeSelectionPresentationHost } from '../selection-presentation'
import { DEFAULT_LAYOUT_REGION } from '@dragcraft/core'
import { defineComponent, h } from 'vue'
import { normalizeStyle } from '../style-utils'

const DefaultContainerShell = defineComponent({
  name: 'DcDefaultContainerShell',

  props: {
    isEmpty: {
      type: Boolean,
      default: false,
    },
    regionVNodes: {
      type: Object as PropType<Record<string, VNode[]>>,
      default: () => ({}),
    },
    chromeVNodes: {
      type: Array as PropType<VNode[]>,
      default: () => [],
    },
    layerVNodes: {
      type: Object as PropType<Record<string, VNode[]>>,
      default: () => ({}),
    },
    forbiddenOverlayVNode: {
      type: Object as PropType<VNode | null>,
      default: null,
    },
    layoutPlan: {
      type: Object,
      default: undefined,
    },
    schema: {
      type: Object as PropType<DesignerSchema>,
      default: undefined,
    },
    selectionPresentation: {
      type: Object as PropType<NodeSelectionPresentationHost>,
      default: undefined,
    },
  },

  setup(props, { slots }) {
    return () => {
      const additionalRegions = Object.entries(props.regionVNodes)
        .filter(([region]) => region !== DEFAULT_LAYOUT_REGION)
        .flatMap(([, nodes]) => nodes)
      const layerNodes = Object.values(props.layerVNodes).flat()

      return h(
        'div',
        {
          'class': 'dc-container-shell',
          'data-dc-component': 'container-shell',
          'data-dc-state': props.isEmpty ? 'empty' : undefined,
          'style': normalizeStyle(props.schema?.root?.style?.surface),
        },
        [
          ...(slots.default?.() ?? []),
          ...additionalRegions,
          ...props.chromeVNodes,
          ...layerNodes,
          h('div', {
            'ref': (element: unknown) => {
              props.selectionPresentation?.registerPlane('root', element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--root',
            'data-dc-selection-plane': 'root',
            'aria-hidden': 'true',
          }),
          h('div', {
            'ref': (element: unknown) => {
              props.selectionPresentation?.registerPlane('content', element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--content',
            'data-dc-selection-plane': 'content',
            'aria-hidden': 'true',
          }),
          h('div', {
            'ref': (element: unknown) => {
              props.selectionPresentation?.registerPlane('viewport', element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--viewport',
            'data-dc-selection-plane': 'viewport',
            'aria-hidden': 'true',
          }),
          props.forbiddenOverlayVNode,
        ],
      )
    }
  },
})

const DefaultContainerShellWithOverlay = DefaultContainerShell as Component & { __dcHandlesForbiddenOverlay?: boolean }
DefaultContainerShellWithOverlay.__dcHandlesForbiddenOverlay = true

export default DefaultContainerShell
