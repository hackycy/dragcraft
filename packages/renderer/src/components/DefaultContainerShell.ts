import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcDefaultContainerShell',

  setup(_, { slots }) {
    return () =>
      h(
        'div',
        { class: 'dc-container-shell' },
        slots.default?.(),
      )
  },
})
