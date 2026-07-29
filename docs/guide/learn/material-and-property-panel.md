---
description: "把公告物料、字段 adapter、全局表单和完整 Designer 装配接入活动页。"
---

# 添加物料、字段和页面设置

## 预期结果

在文本物料已可编辑后，添加公告可以看到同一份物料定义如何同时驱动画布、物料栏和右侧属性面板。

## 前置状态

你已经完成最小编辑器，并理解属性修改通过命令写入 Schema。

## 完整文件

### 定义公告物料

新建 `src/domain/widgets/notice.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/notice.ts

`type` 是持久化 Schema 标识，不能随意改名。`defaultProps` 在拖入时复制给新节点，`formSchema` 决定选中节点后右侧显示哪些字段。

将这一阶段的文本和公告物料收集为设计器输入：

`src/domain/widgets/activity.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/activity.ts

### 注册业务字段

公告中的 `Asset` 不是内置字段。新建 `src/forms/index.ts`，把它和 Ant Design Vue adapter 合并：

<<< ../../../examples/guide-project/src/forms/index.ts

`Asset` 使用 `modelValue` 和 `onUpdate:modelValue`，因此表单引擎知道如何读取和写入它。`visible` 读取同一表单的当前值，只有打开“使用背景图”时才显示资产字段。

### 添加页面级设置

`src/editor/global-config-schema.ts`：

<<< ../../../examples/guide-project/src/editor/global-config-schema.ts

没有 `bindTo` 的全局字段默认写入 `globalConfig.title`。背景颜色明确绑定到 `root.style.surface.backgroundColor`，因此它修改的是页面承载面，不是业务 `globalConfig`。

### 组装完整活动页 Designer

新建 `src/editor/create-activity-schema.ts`：

<<< ../../../examples/guide-project/src/editor/create-activity-schema.ts

它只在最小 Schema 上加入公告和页面视觉，不会提前引入页头、容器或动作。

新建 `src/editor/create-activity-designer.ts`：

<<< ../../../examples/guide-project/src/editor/create-activity-designer.ts

替换 `src/App.vue`。这还是一个完整可运行的编辑器，只是尚未加入保存、预览、布局容器和设备选择：

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { DcDesigner } from '@dragcraft/designer'
import { createActivityDesigner } from './editor/create-activity-designer'

const designer = createActivityDesigner()

onBeforeUnmount(designer.dispose)
</script>

<template>
  <DcDesigner :instance="designer" />
</template>
```

## 立即可观察行为

现在可以拖入公告，编辑文案、色调和背景图；右侧全局页签可以编辑页面标题和背景色。

## 设计原因

可复用字段使用字符串键和 `fieldComponentMap`。当前表单专用的说明、分割线或轻量操作区才使用 render factory；函数式 Vue 组件也必须先注册为字段 adapter。

## 限制与下一步

`type`、字段 key 和 `bindTo` 都会影响已保存 Schema 的含义。下一页先把这份页面保存到宿主仓储，再由独立运行时读取它。

## 完成检查

拖入公告后能编辑文案、色调和背景图，且页面标题与背景色可以从全局页签修改。

下一步：[保存草稿并预览运行时](/guide/learn/persistence-and-runtime)。
