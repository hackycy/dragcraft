import type { DesignerSchema } from '@dragcraft/core'
import type { Component, PropType, VNode } from 'vue'
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
  },

  setup(props, { slots }) {
    return () =>
      h(
        'div',
        {
          class: 'dc-container-shell',
          style: normalizeStyle(props.schema?.root?.style?.surface),
        },
        [
          ...(slots.default?.() ?? []),
          props.forbiddenOverlayVNode,
        ],
      )
  },
})

const DefaultContainerShellWithOverlay = DefaultContainerShell as Component & { __dcHandlesForbiddenOverlay?: boolean }
DefaultContainerShellWithOverlay.__dcHandlesForbiddenOverlay = true

export default DefaultContainerShell
