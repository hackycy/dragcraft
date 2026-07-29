import type { DesignerWidgetMeta, WidgetDefinition } from '@dragcraft/designer'
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

export const floatingActionWidgetDefinition: WidgetDefinition<DesignerWidgetMeta> = {
  meta: {
    type: 'floating-action',
    title: '浮动操作',
    group: 'marketing',
    defaultProps: { label: '咨询' },
    defaultLayout: {
      placement: {
        kind: 'layer',
        mode: 'framework',
        anchor: { block: 'end', inline: 'end' },
        offset: { blockEnd: 16, inlineEnd: 16 },
      },
    },
    formSchema: {
      sections: [{
        title: '浮动操作',
        fields: [{
          key: 'label',
          label: '按钮文字',
          component: 'Input',
          rules: [{ required: true, message: '按钮文字不能为空' }],
        }],
      }],
    },
    material: {
      description: '固定在页面内容上方的操作入口',
      tags: ['营销', '浮层'],
    },
  },
  component: FloatingActionWidget,
}
