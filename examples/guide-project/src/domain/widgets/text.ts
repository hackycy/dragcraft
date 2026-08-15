import { defineComponent, h } from 'vue'

export const GuideTextWidget = defineComponent({
  name: 'GuideTextWidget',
  props: {
    content: { type: String, default: '新文本' },
  },
  setup(props) {
    return () => h('p', { class: 'guide-text-widget' }, props.content)
  },
})
