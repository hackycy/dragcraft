import { defineComponent, h } from 'vue'

export const FloatingActionWidget = defineComponent({
  name: 'GuideFloatingActionWidget',
  props: {
    label: { type: String, default: '咨询' },
  },
  setup(props) {
    return () => h('button', {
      type: 'button',
      class: 'guide-floating-action',
    }, props.label)
  },
})
