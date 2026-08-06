import { defineMaterial } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

export const GuideTextWidget = defineComponent({
  name: 'GuideTextWidget',
  props: { content: { type: String, default: '新文本' } },
  setup: props => () => h('p', { class: 'guide-text-widget' }, props.content),
})

export const textMaterial = defineMaterial({
  type: 'guide-text',
  schema: { defaultProps: { content: '新文本' } },
  authoring: { policy: { remove: 'confirmation-required' } },
  panel: { title: '文本', group: 'basic', description: '展示一段可编辑文字' },
  inspector: { formSchema: { sections: [{ title: '内容', fields: [
    { key: 'content', label: '文本内容', component: 'Input' },
  ] }] } },
  presentation: { kind: 'visual', preview: GuideTextWidget },
})
