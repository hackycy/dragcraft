import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcDefaultContainerShell',

  props: {
    isEmpty: {
      type: Boolean,
      default: false,
    },
    slotVNodes: {
      type: Object,
      default: () => ({}),
    },
    layoutPlan: {
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
