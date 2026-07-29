---
description: "查看页面 Schema 的完整形状，并理解读取快照和命令写入的不同职责。"
---

# 保存 Schema，并通过命令写入

## 预期结果

编辑器保存的是页面 Schema，不保存 Vue 组件实例。Schema 是草稿、发布版本和业务运行时之间的可传输数据；Vue 组件由你的 `componentMap` 在需要时解释。

## 前置状态

你已经有一个包含文本节点的最小编辑器，并能够从属性面板修改它。

## 完整文件

### 查看活动页的初始数据

最小编辑器使用下面的初始 Schema。它只包含一个文本节点，因此在理解数据形状时不需要提前认识公告、布局或容器：

`src/editor/create-starter-schema.ts`：

<<< ../../../examples/guide-project/src/editor/create-starter-schema.ts

`root.children` 保存页面顶层节点，`globalConfig` 保存业务页面数据，`root.style.surface` 描述页面承载面的样式 DSL。每个 `type` 都必须能被当前注册表解析；因此 Designer 先注册物料，再导入初始 Schema。下一页会在同一结构上加入公告和页面级配置。

### 读取快照

在 Vue 组件中，用 `useDesigner()` 订阅当前提交的 Schema：

```ts
import { watch } from 'vue'
import { useDesigner } from '@dragcraft/designer'

const { schema, exportSchema } = useDesigner(designer)

watch(schema, value => {
  console.log(value.root.children)
})

const payload = exportSchema()
```

`schema` 是响应式只读快照，适合画布和预览。`exportSchema()` 返回可传输的深拷贝，适合保存到服务端。不要把前者当作可写状态，也不要保存 Vue 组件实例。

## 立即可观察行为

修改属性后，画布立即显示新值；使用撤销后又回到旧值。你可以在 Vue 组件中订阅快照，也可以导出独立副本准备保存。

## 设计原因

### 通过命令写入

属性表单的每次修改都走同一条命令链路：

```text
字段 change
  -> Designer 解析 bindTo
  -> engine.execute(...)
  -> Core 校验、写入 Schema、记录历史并触发事件
  -> Renderer 根据新快照更新画布
```

需要从宿主代码修改节点时，也执行内置命令：

```ts
import { CommandType } from '@dragcraft/designer'

designer.engine.execute({
  type: CommandType.UPDATE_PROPS,
  payload: {
    nodeId: 'welcome-text',
    props: { content: '已通过命令更新文本。' },
  },
})
```

这条路径让撤销、约束和事件保持一致。相同值更新和无效命令不会增加 history，也不会触发成功的 `schema:changed` 事件。

## 限制与下一步

不直接修改 `engine.store.schema.value`。命令才会经过注册表校验、历史和事件；下一页会在同一条链路上接入业务物料和字段。

## 完成检查

你能指出一次属性修改使用的命令入口，以及它在 Schema 中对应的保存位置。

下一步：[添加物料、字段和页面设置](/guide/learn/material-and-property-panel)。
