---
description: "运行 guide-project 并把最小 DragCraft 编辑器接入自己的 Vue 应用。"
---

# 5 分钟跑通

这篇教程的目标是得到一个可观察的结果：左侧出现一个“文本”物料，拖入画布后可以在右侧编辑内容，并且可以撤销和重做。先运行仓库示例，确认环境正常，再复制最小接入代码。

## 运行仓库示例

在仓库根目录执行：

```bash
pnpm install
pnpm --filter guide-project dev
```

打开两个页面：

- `http://localhost:9982/minimal.html`：只有一个文本物料，用来验证最小接入。
- `http://localhost:9982/`：完整活动页示例，包含容器、设备外壳、全局配置、草稿保存和只读 Runtime。

先在最小页面拖入文本，选中节点，修改“文本内容”，再点击撤销。三步都成功后，说明 Vue、字段 adapter、Designer 样式和浏览器事件已经连通。

## 安装公开依赖

自己的 Vue 3 + TypeScript 应用至少需要 Designer、一个字段 adapter、Vue 和对应 UI 库：

```bash
pnpm add @dragcraft/designer @dragcraft/fields-ant-design-vue ant-design-vue vue
```

业务应用只从公开聚合入口导入。不要为了创建 Designer 直接导入内部 workspace package。

## 创建最小实例

下面的 Schema 是可保存的普通 JSON。`materials` 决定允许创建哪些 `type`；`fieldComponentMap` 决定属性表单如何找到真实控件。

```ts
import { createDesigner } from '@dragcraft/designer'
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'
import { textMaterial } from './text-material'

export const designer = createDesigner({
  schema: {
    version: '1',
    globalConfig: {},
    page: { props: {} },
    nodes: [{
      id: 'welcome-text',
      type: 'guide-text',
      props: { content: '欢迎使用 DragCraft' },
    }],
    structure: { root: ['welcome-text'], containers: {} },
  },
  materials: [textMaterial],
  fieldComponentMap: createAntDesignVueFields(),
})
```

物料最小需要一个稳定 `type` 和 `presentation`。要让右侧属性面板出现字段，再添加 `schema.defaultProps` 和 `inspector.formSchema`：

```ts
import { defineComponent, h } from 'vue'
import { defineMaterial } from '@dragcraft/designer'

const TextPreview = defineComponent({
  props: { content: { type: String, default: '新文本' } },
  setup(props) {
    return () => h('p', props.content)
  },
})

export const textMaterial = defineMaterial({
  type: 'guide-text',
  panel: { title: '文本', group: 'basic' },
  schema: { defaultProps: { content: '新文本' } },
  inspector: {
    formSchema: {
      sections: [{
        title: '内容',
        fields: [{ key: 'content', label: '文本内容', component: 'Input' }],
      }],
    },
  },
  presentation: { kind: 'visual', preview: TextPreview },
})
```

教程中的完整物料实现位于 [`examples/guide-project/src/domain/widgets/text.ts`](https://github.com/hackycy/dragcraft/blob/main/examples/guide-project/src/domain/widgets/text.ts)，实例工厂位于 [`minimal-designer.ts`](https://github.com/hackycy/dragcraft/blob/main/examples/guide-project/src/editor/minimal-designer.ts)。

## 挂载工作台

应用入口加载 UI 库基础样式和完整 Standard 主题：

```ts
import { createApp } from 'vue'
import { DcDesigner } from '@dragcraft/designer'
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/designer/standard.css'
import App from './App.vue'

createApp(App).mount('#app')
```

组件创建时持有实例，卸载时释放实例：

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { DcDesigner } from '@dragcraft/designer'
import { designer } from './designer'

onBeforeUnmount(() => designer.dispose())
</script>

<template>
  <main class="editor">
    <DcDesigner :instance="designer" />
  </main>
</template>
```

`@dragcraft/designer/standard.css` 是完整工作台主题。只有准备实现所有工作台 recipe 时，才改用 `structure.css`。

## 验证和下一步

完成以下检查后继续扩展：

- 物料栏显示“文本”，拖入后画布显示默认文本。
- 选中节点后，右侧字段可以修改 `props.content`。
- `designer.execute({ type: 'undo' })` 和 `designer.execute({ type: 'redo' })` 能恢复内容。
- 组件卸载时没有遗留事件监听。

接下来阅读 [了解接入边界](/guide/learn/prerequisites)，再按需进入 [业务物料](/guide/customization/materials)、[表单与字段](/guide/customization/forms-and-fields) 或 [保存、加载与只读预览](/guide/learn/persistence-and-runtime)。
