import type { PropType, VNode } from 'vue'
import type { NodeSelectionPresentationHost } from './selection-presentation'
import type { StyleValueMap } from './semantic'
import { DcScrollArea } from '@dragcraft/ui'
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcCanvasSurface',

  props: {
    isEmpty: { type: Boolean, required: true },
    rootVNodes: { type: Array as PropType<VNode[]>, required: true },
    surfaceStyle: { type: Object as PropType<StyleValueMap>, default: undefined },
    selectionPresentation: { type: Object as PropType<NodeSelectionPresentationHost>, required: true },
    forbiddenOverlay: { type: Object as PropType<VNode | null>, default: null },
    headlessOverlay: { type: Object as PropType<VNode | null>, default: null },
  },

  setup(props) {
    return () => h('div', {
      'class': ['dc-canvas-surface', { 'dc-canvas-surface--empty': props.isEmpty }],
      'data-dc-component': 'canvas-surface',
      'data-dc-overlay-boundary': '',
      'data-dc-state': props.isEmpty ? 'empty' : undefined,
    }, [
      h(DcScrollArea, { class: 'dc-canvas-surface__scrollport' }, {
        default: () => h('div', { class: 'dc-canvas-surface__content-layout' }, [
          h('div', { class: 'dc-canvas-surface__content-row' }, [
            h('div', { class: 'dc-canvas-surface__content', style: props.surfaceStyle }, props.rootVNodes),
          ]),
          h('div', {
            'ref': (element: unknown) => {
              props.selectionPresentation.registerPlane('content', element instanceof HTMLElement ? element : null)
            },
            'class': 'dc-node-selection-plane dc-node-selection-plane--content',
            'data-dc-selection-plane': 'content',
            'aria-hidden': 'true',
          }),
        ]),
      }),
      h('div', {
        'ref': (element: unknown) => {
          props.selectionPresentation.registerPlane('viewport', element instanceof HTMLElement ? element : null)
        },
        'class': 'dc-node-selection-plane dc-node-selection-plane--viewport',
        'data-dc-selection-plane': 'viewport',
        'aria-hidden': 'true',
      }),
      props.forbiddenOverlay,
      props.headlessOverlay,
    ])
  },
})
