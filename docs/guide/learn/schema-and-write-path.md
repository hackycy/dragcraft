---
description: "理解 DocumentSchema、AuthoringAction 与 history 的最短写入路径。"
---

# 理解 Schema 与写入链路

编辑器里有两种状态：`DocumentSchema` 是要保存和传输的页面数据，`selection`、drag 和 panel 状态是设计态交互。只有前者进入历史和 Runtime。

- [DocumentSchema](/guide/fundamentals/schema) 说明节点、所有权、导入状态与恢复。
- [状态、动作、历史与事件](/guide/fundamentals/state-commands-and-history) 说明只读状态、结果、batch 与 undo/redo。

```text
业务交互
  -> 字段绑定、拖放或 designer.execute()
  -> Authoring engine 解析并校验 action
  -> 提交 DocumentSchema
  -> 更新 history
  -> Designer Presentation 重新投影画布
```

公开 `execute()` 使用 `create-node`、`move-node`、`update-node`、`update-page`、`update-global-config`、`batch`、`undo` 和 `redo` 等 action。所有持久化写入都进入这条路径；保存或传输使用 `designer.exportSchema()`，不要修改 `designer.document`。
