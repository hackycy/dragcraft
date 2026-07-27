---
description: "安装 DragCraft，并在 Vue 应用中挂载可拖入文本物料的最小编辑器。"
---

# 挂载最小编辑器

先让一个文本物料出现在编辑器中。这个阶段只需要物料 metadata、组件映射和字段 adapter。

安装依赖：

```bash
pnpm add @dragcraft/designer @dragcraft/fields-ant-design-vue ant-design-vue vue
```

最小实例来自贯穿示例：

<<< ../../../examples/guide-project/src/editor/minimal-designer.ts#tutorial-minimal-designer

`widgetMetas` 决定左侧能创建什么，`componentMap` 把 Schema 中的 `type` 映射到 Vue 组件，`fieldComponentMap` 告诉右侧表单如何绑定实际 UI 控件。

在应用入口加载字段样式和工作台主题：

<<< ../../../examples/guide-project/src/main.ts#tutorial-workbench-styles

然后把 `createMinimalDesigner()` 返回的实例传给 `DcDesigner`。贯穿示例在预览切换前保留编辑器：

<<< ../../../examples/guide-project/src/App.vue#tutorial-designer-mount

现在拖入“文本”，选中它并修改 `content`。画布会更新，但浏览器不会出现任何直接修改 Schema 的 API。

| 框架负责 | 宿主负责 |
| --- | --- |
| 拖放、选中、表单 change 到命令的翻译 | 物料组件的内容、字段 UI 库和应用布局 |

不要通过 `engine.store.schema.value` 修改页面。它是只读快照，所有页面写入都应通过命令链路发生。

**完成检查**：可以拖入一个文本物料、选中它并修改 `content`，且撤销操作能恢复旧值。

下一步：[理解 Schema 与写入链路](/guide/learn/schema-and-write-path)。
