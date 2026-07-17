import type { DesignerSchema } from '@dragcraft/core'
import type { Component, PropType, VNode } from 'vue'
import type { NodeSelectionPresentationHost } from '../selection-presentation'
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
      type: Object,
      default: () => ({}),
    },
    chromeVNodes: {
      type: Array,
      default: () => [],
    },
    layerVNodes: {
      type: Object,
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
    return () =>
      h(
        'div',
        {
          'class': 'dc-container-shell',
          'data-dc-component': 'container-shell',
          'data-dc-state': props.isEmpty ? 'empty' : undefined,
          'style': normalizeStyle(props.schema?.root?.style?.surface),
        },
        [
          ...(slots.default?.() ?? []),
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
  },
})

const DefaultContainerShellWithOverlay = DefaultContainerShell as Component & { __dcHandlesForbiddenOverlay?: boolean }
DefaultContainerShellWithOverlay.__dcHandlesForbiddenOverlay = true

export default DefaultContainerShell
