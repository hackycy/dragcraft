import { defineComponent, h } from 'vue'

/**
 * Slot-style drop indicator shown during drag-over.
 * Renders a dashed-border rectangle placeholder indicating where
 * the widget will be placed. Styled via CSS class `dc-drop-indicator`.
 */
export default defineComponent({
  name: 'DcDefaultDropIndicator',

  setup() {
    return () =>
      h('div', { class: 'dc-drop-indicator' })
  },
})
