import { defineComponent, h } from 'vue'

export default defineComponent({
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
    layoutPlan: {
      type: Object,
      default: undefined,
    },
    schema: {
      type: Object,
      default: undefined,
    },
  },

  setup(_, { slots }) {
    return () =>
      h(
        'div',
        { class: 'dc-container-shell' },
        slots.default?.(),
      )
  },
})
