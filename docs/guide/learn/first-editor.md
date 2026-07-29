---
description: "在新的 Vue 应用中添加文本物料、创建 Designer 实例并挂载可编辑工作台。"
---

# 快速开始：挂载编辑器

## 预期结果

把下面这些文件放进上一页创建的项目。启动后，你会看到一个包含文本节点的三栏编辑器；选中文本后可以在右侧修改内容，并可以继续从左侧拖入文本。

## 前置状态

你已经创建了 Vite Vue TypeScript 项目，并安装了 Designer、字段 adapter 与 Ant Design Vue。

## 完整文件

### 创建文本物料

新建 `src/domain/widgets/text.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/text.ts

一个 `WidgetDefinition` 把两件事放在一起：`meta` 定义 Schema 节点如何创建和配置，`component` 决定这个节点如何在画布中渲染。`type: 'guide-text'` 是会保存到 Schema 的持久化标识，不要把它当作 Vue 组件名。

### 创建初始页面和 Designer

新建 `src/editor/create-starter-schema.ts`：

<<< ../../../examples/guide-project/src/editor/create-starter-schema.ts

新建 `src/editor/minimal-designer.ts`：

<<< ../../../examples/guide-project/src/editor/minimal-designer.ts

`widgetMetas` 决定左侧能创建什么，`componentMap` 把 Schema 中的 `type` 映射到 Vue 组件，`fieldComponentMap` 告诉右侧表单怎样连接实际 UI 控件。`engineOptions.initialSchema` 会在物料注册后导入，因此初始节点可以被当前注册表校验。

### 挂载工作台

替换 `src/main.ts`：

```ts
import { createApp } from 'vue'
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/designer/styles'
import App from './App.vue'
import './styles.css'

createApp(App).mount('#app')
```

新建 `src/dragcraft.d.ts`：

```ts
declare module '@dragcraft/designer/styles'
```

这是 CSS 子路径的本地 TypeScript 声明。它不影响运行时加载，但让默认 Vite 模板的 `vue-tsc -b` 能识别该样式导入。

替换 `src/App.vue`：

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { DcDesigner } from '@dragcraft/designer'
import { createMinimalDesigner } from './editor/minimal-designer'

const designer = createMinimalDesigner()

onBeforeUnmount(designer.dispose)
</script>

<template>
  <DcDesigner :instance="designer" />
</template>
```

替换 `src/styles.css`：

```css
html,
body,
#app {
  min-height: 100vh;
  margin: 0;
}

* {
  box-sizing: border-box;
}
```

## 立即可观察行为

运行项目：

```bash
pnpm dev
```

现在选中“选中我，然后在右侧修改文本。”，修改 `content`，再使用工作台的撤销按钮恢复旧值。

## 设计原因

`WidgetDefinition` 同时保存了可创建的 metadata 和实际 Vue 组件。`createDesigner()` 在同一个实例中注册它们、字段 adapter 和初始 Schema，因此物料栏、属性面板和画布始终解释同一份节点定义。

## 限制与下一步

不要通过 `engine.store.schema.value` 修改页面。它是只读快照；右侧表单已经把字段变更翻译为命令，下一页会解释这条写入链路。

## 完成检查

可以拖入一个文本物料、选中它并修改 `content`，且撤销操作能恢复旧值。

下一步：[理解 Dragcraft 的边界](/guide/learn/mental-model)。
