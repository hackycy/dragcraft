import type { WidgetFixtureDefinition } from './contract'
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

export const textWidgetDefinition: WidgetFixtureDefinition = {
  meta: {
    type: 'guide-text',
    title: '文本',
    group: 'basic',
    defaultProps: { content: '新文本' },
    defaultStyle: {
      container: { padding: 12 },
      content: { color: '#172033' },
    },
    formSchema: {
      sections: [{
        title: '内容',
        fields: [{ key: 'content', label: '文本内容', component: 'Input' }],
      }],
    },
    material: {
      description: '展示一段可编辑文字',
      tags: ['基础'],
    },
  },
  component: GuideTextWidget,
}
