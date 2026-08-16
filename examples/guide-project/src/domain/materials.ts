import type { MaterialDefinition } from '@dragcraft/designer'
import { DesignerViewportPortal } from '@dragcraft/designer'
import { defineComponent, h } from 'vue'
import { ColumnContainerWidget } from './widgets/container'
import { FloatingActionWidget } from './widgets/floating-action'
import { NoticeWidget } from './widgets/notice'
import { GuidePageHeaderWidget } from './widgets/page-header'
import { GuideTextWidget } from './widgets/text'

const GuideFloatingActionFrame = defineComponent({
  name: 'GuideFloatingActionFrame',
  setup(_, { slots }) {
    return () => h(DesignerViewportPortal, null, {
      default: () => h('div', { class: 'guide-presentation-frame guide-presentation-frame--floating-action' }, slots.default?.()),
    })
  },
})

export const guideMaterials: readonly MaterialDefinition[] = [
  {
    type: 'page-header',
    panel: { title: '活动页头', group: 'chrome', groupTitle: '页面框架' },
    schema: { defaultProps: { title: '夏日活动页' } },
    authoring: { policy: { create: 'denied' } },
    inspector: {
      formSchema: {
        sections: [{
          title: '页头内容',
          fields: [{ key: 'title', label: '标题', component: 'Input' }],
        }],
      },
    },
    presentation: { kind: 'visual', preview: GuidePageHeaderWidget },
  },
  {
    type: 'guide-text',
    panel: { title: '文本', group: 'basic', groupTitle: '基础', description: '展示一段可编辑文字', tags: ['基础'] },
    schema: {
      defaultProps: { content: '新文本' },
      defaultStyle: { container: { padding: 12 }, content: { color: '#172033' } },
    },
    inspector: {
      formSchema: {
        sections: [{
          title: '内容',
          fields: [{ key: 'content', label: '文本内容', component: 'Input' }],
        }],
      },
    },
    presentation: { kind: 'visual', preview: GuideTextWidget },
  },
  {
    type: 'notice',
    panel: {
      title: '公告',
      group: 'marketing',
      groupTitle: '营销',
      description: '在页面中展示活动信息',
      tags: ['营销'],
      keywords: ['notice', 'announcement'],
    },
    schema: {
      defaultProps: {
        text: '夏日活动已经开始',
        tone: 'warm',
        hasImage: false,
        image: '',
        featured: false,
      },
    },
    inspector: {
      formSchema: {
        sections: [{
          title: '公告内容',
          fields: [
            {
              key: 'text',
              label: '文案',
              component: 'Input',
              rules: [{ required: true, message: '公告文案不能为空' }],
            },
            {
              key: 'tone',
              label: '色调',
              component: 'Select',
              componentProps: {
                options: [
                  { label: '暖色', value: 'warm' },
                  { label: '冷色', value: 'cool' },
                ],
              },
            },
            { key: 'hasImage', label: '使用背景图', component: 'Switch' },
            { key: 'image', label: '背景图', component: 'Asset' },
            { key: 'featured', label: '标记为精选', component: 'Switch' },
          ],
        }],
      },
    },
    presentation: { kind: 'visual', preview: NoticeWidget },
  },
  {
    type: 'column-container',
    panel: {
      title: '分栏容器',
      group: 'layout',
      groupTitle: '布局',
      description: '由业务组件决定列布局和插入方向',
      tags: ['布局'],
    },
    schema: {
      defaultProps: { gap: 12 },
      container: { regions: [{ id: 'content', cardinality: { max: 4 } }] },
    },
    inspector: {
      formSchema: {
        sections: [{
          title: '布局',
          fields: [{ key: 'gap', label: '间距', component: 'InputNumber', componentProps: { min: 0, max: 48 } }],
        }],
      },
    },
    presentation: { kind: 'visual', preview: ColumnContainerWidget },
  },
  {
    type: 'floating-action',
    panel: {
      title: '浮动操作',
      group: 'marketing',
      description: '固定在页面内容上方的操作入口',
      tags: ['营销', '浮层'],
    },
    schema: { defaultProps: { label: '咨询' } },
    inspector: {
      formSchema: {
        sections: [{
          title: '浮动操作',
          fields: [{ key: 'label', label: '按钮文字', component: 'Input' }],
        }],
      },
    },
    presentation: {
      kind: 'visual',
      preview: FloatingActionWidget,
      frame: GuideFloatingActionFrame,
    },
  },
]
