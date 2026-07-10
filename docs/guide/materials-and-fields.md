# 自定义物料

一个物料由“编辑协议”和“Vue 组件”组成。前者决定能否创建、如何配置和放到哪里；后者决定页面实际显示什么。

先把两者写成同一份定义：

```ts
import type { DesignerWidgetMeta } from '@dragcraft/designer'
import type { WidgetDefinition } from '@dragcraft/widgets'
import { buildComponentMap, getWidgetMetas } from '@dragcraft/widgets'
import { defineComponent, h } from 'vue'

const NoticeWidget = defineComponent({
  props: { text: { type: String, required: true } },
  setup: props => () => h('div', { class: 'notice' }, props.text),
})

const notice: WidgetDefinition<DesignerWidgetMeta> = {
  meta: {
    type: 'notice',
    title: '公告',
    group: 'marketing',
    defaultProps: { text: '活动公告' },
    defaultStyle: { container: { marginTop: 8 } },
    formSchema: {
      sections: [{
        title: '内容',
        fields: [{ key: 'text', label: '公告文字', component: 'Input' }],
      }],
    },
    material: {
      description: '在页面顶部展示活动消息',
      tags: ['营销'],
      keywords: ['notice', 'announcement'],
    },
  },
  component: NoticeWidget,
}

const definitions = [notice]
export const widgetMetas = getWidgetMetas(definitions)
export const componentMap = buildComponentMap(definitions)
```

`type` 是 Schema 的稳定标识，因此应由业务维护并避免随意改名。`defaultProps` 会在拖入时复制到新节点，`formSchema` 则决定右侧属性面板显示哪些字段。

## 控制创建、选择和布局

行为字段让约束留在物料定义里，而不是散落在界面事件中。

```ts
const tabBarMeta: DesignerWidgetMeta = {
  type: 'tab-bar',
  title: 'Tab 栏',
  group: 'navigation',
  defaultProps: { items: [] },
  formSchema: { sections: [] },
  defaultLayout: {
    placement: {
      kind: 'chrome',
      edge: 'block-end',
      position: 'fixed',
      reserve: { mode: 'size', size: 56 },
      avoidContent: true,
    },
  },
  creatable: ({ schema }) => schema.root.children?.some(node => node.type === 'tab-bar')
    ? { allowed: false, messageKey: 'forbidden.tabBarExists' }
    : { allowed: true },
}
```

`creatable` 在每个新增入口由 core 裁决，拖入和自定义复制动作都会遵守它。`defaultLayout` 让节点进入固定的页面 chrome，而不是普通内容流。

`selectable`、`draggable`、`sortable`、`deletable` 和 `mask` 也可以是布尔值或基于当前节点与 Schema 的函数。把行为规则放在这里，才能保证物料栏、画布和结构树得到一致结果。

## 定制物料卡片

默认物料栏使用 `material` 中的标题、图标、描述和关键词。只想改变卡片内容时使用 `materialItemRenderer`，不要在渲染器里自己重新实现拖拽外壳。

```ts
import { h } from 'vue'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  extensions: {
    materialItemRenderer: ({ material, dragging }) => h('div', {
      class: { 'material-card': true, 'material-card--dragging': dragging },
    }, [material.title, material.tags.join(' / ')]),
  },
})
```

关于物料，目前知道这些就够了。接下来阅读 [配置表单与字段](/guide/forms-and-fields)，让物料的属性编辑适配你的 UI 库。
