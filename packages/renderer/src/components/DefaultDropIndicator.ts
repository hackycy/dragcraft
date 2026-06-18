import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'DcDefaultDropIndicator',

  setup() {
    return () =>
      h('div', { class: 'dc-drop-indicator' }, [
        h('div', { class: 'dc-drop-indicator__line' }),
      ])
  },
})
