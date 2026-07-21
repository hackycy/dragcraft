---
description: "在 Vue 3 中安装并挂载最小 dragcraft 设计器，注册文本物料、字段 adapter 和主题。"
---

# 快速开始

先把一个可拖入文本物料的设计器挂到 Vue 3 页面中。

先安装依赖：

```bash
pnpm add @dragcraft/designer @dragcraft/themes @dragcraft/fields-ant-design-vue ant-design-vue vue
```

然后创建一个最小物料和设计器实例：

```ts
// designer.ts
import type { DesignerWidgetMeta } from '@dragcraft/designer'
import { createDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { defineComponent, h } from 'vue'

const TextWidget = defineComponent({
  props: { content: { type: String, default: '新文本' } },
  setup: props => () => h('p', props.content),
})

const textMeta: DesignerWidgetMeta = {
  type: 'text',
  title: '文本',
  group: 'basic',
  defaultProps: { content: '新文本' },
  formSchema: {
    sections: [{
      title: '内容',
      fields: [{ key: 'content', label: '文本内容', component: 'Input' }],
    }],
  },
  material: { description: '展示一段文字', tags: ['基础'] },
}

export const designer = createDesigner({
  widgetMetas: [textMeta],
  componentMap: { text: TextWidget },
  fieldComponentMap: createAntDesignVueFields(),
})
```

`textMeta` 说明左侧可创建什么、创建后使用哪些默认值，以及右侧如何编辑属性。`componentMap` 把 schema 中的 `type: 'text'` 映射到真正的 Vue 组件。

## 挂载设计器

在页面中导入主题并挂载 `DcDesigner`：

```vue
<script setup lang="ts">
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/themes'
import { DcDesigner } from '@dragcraft/designer'
import { designer } from './designer'
</script>

<template>
  <DcDesigner :instance="designer" />
</template>
```

这里的 `ant-design-vue/dist/reset.css` 只用于示例中的 Ant Design Vue 字段 adapter；它不是 Standard 主题的依赖。

现在你可以从左侧拖入文本，选中它后在右侧修改 `content`。设计器把修改写进 Schema；它不会替你把页面保存到服务端。

> [!TIP]
> 默认入口与 `@dragcraft/themes/standard` 都包含必要结构样式和 Standard 视觉；Google Material 3 使用 `@dragcraft/themes/material`。完整自定义工作台时导入 `@dragcraft/themes/structure`，再基于公开主题契约编写视觉配方，不能省略结构 CSS。

接下来在 [集成设计器](/guide/designer-integration) 中配置初始 Schema、全局配置和工作台布局。
