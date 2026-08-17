---
description: "通过只读文档状态、AuthoringAction 和 history 理解 DragCraft 的写入保证。"
---

# 状态、动作、历史与事件

Designer 将每次 Schema 修改作为原子 `AuthoringAction` 执行。只有实际改变 DocumentSchema 的 action 才会提交新快照并进入 history。

## 读取状态

宿主从 `DesignerInstance` 读取只读响应式状态：

| 入口 | 用途 |
| --- | --- |
| `designer.document` | 读取当前文档状态、Schema 与 diagnostics；`status: 'rejected'` 时没有可安装的 schema。 |
| `designer.selection` | 读取当前 selected 和 hovered 节点。 |
| `designer.history` | 读取 undo/redo 是否可用及其计数。 |
| `useDesigner(instance).schema` | 在 Vue 组件中响应 DocumentSchema。 |

需要保存或传输时调用 `designer.exportSchema()`。不要修改任何只读状态返回的对象。

## 观察文档变化

Designer 没有把 selection、hover 或 drag 暴露为公共业务事件。宿主只需要观察 `designer.document` 判断页面是否有未保存更改：

```ts
import { watch } from 'vue'

const stop = watch(designer.document, () => {
  status.value = '有未保存的更改'
}, { flush: 'sync' })
```

保存按钮读取 `designer.exportSchema()`；不要从 selection 或画布 DOM 推断 Schema 是否改变。组件卸载时停止 watcher，并按 [创建可运行编辑器](/guide/learn/first-editor) 释放实例。

## 执行 Action

```ts
const result = designer.execute({
  type: 'update-node',
  nodeId: 'notice-1',
  node: { type: 'notice', props: { text: '新的公告内容' } },
})
```

结果是 `committed`、`unchanged`、`rejected` 或 `confirmation-required`。相同值、无效 destination 与不被 authoring policy 允许的操作都不会写入 history。宿主根据稳定 `code` 提示用户，但不应在失败后补写 Schema。

## 合并修改

将应当作为一次撤销单元的修改放入 `batch` action：

```ts
designer.execute({
  type: 'batch',
  actions: [updateNoticeAction, updatePageAction],
})
```

batch 原子提交，且只在内容实际变化时产生一条 history。undo/redo 恢复已提交文档，不会再次运行 authoring policy。

## 验证写入保证

- 有效修改只增加一条 history。
- 写入相同值返回 `unchanged`。
- 拒绝结果不改变 DocumentSchema 或 history。
- batch 后一次撤销恢复整组修改。
- 导入新页面后 history 与当前文档一致。

节点操作如何接入权限和确认，见 [动作与 Authoring Policy](/guide/customization/actions-and-policies)。
