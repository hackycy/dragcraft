import { defineMaterial, DesignerViewportPortal } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'

const FloatingActionFrame = defineComponent({
  name: 'GuideFloatingActionFrame',
  setup: (_, { slots }) => () => h(DesignerViewportPortal, null, {
    default: () => h('div', { class: 'guide-floating-action-frame' }, slots.default?.()),
  }),
})

export const FloatingActionWidget = defineComponent({
  name: 'GuideFloatingActionWidget',
  props: { label: { type: String, default: '咨询' } },
  setup: props => () => h('button', { type: 'button', class: 'guide-floating-action' }, props.label),
})

export const floatingActionMaterial = defineMaterial({
  type: 'floating-action',
  schema: { defaultProps: { label: '咨询' } },
  authoring: { policy: { remove: 'confirmation-required' } },
  panel: { title: '浮动操作', group: 'marketing', description: '固定在页面内容上方的操作入口' },
  inspector: { formSchema: { sections: [{ title: '浮动操作', fields: [
    { key: 'label', label: '按钮文字', component: 'Input', rules: [{ required: true, message: '按钮文字不能为空' }] },
  ] }] } },
  presentation: { kind: 'visual', preview: FloatingActionWidget, frame: FloatingActionFrame },
})
