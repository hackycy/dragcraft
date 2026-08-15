import { defineComponent, h } from 'vue'

export const GuidePageHeaderWidget = defineComponent({
  name: 'GuidePageHeaderWidget',
  props: {
    title: { type: String, default: '活动页' },
  },
  setup(props) {
    return () => h('header', { class: 'guide-page-header' }, props.title)
  },
})
