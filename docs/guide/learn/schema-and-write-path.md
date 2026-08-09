---
description: "理解 DocumentSchema、AuthoringAction 与 history 的最短写入路径。"
---

# 理解 Schema 与写入链路

- [DocumentSchema](/guide/fundamentals/schema) 说明节点、所有权、导入状态与恢复。
- [状态、动作与历史](/guide/fundamentals/state-commands-and-history) 说明只读状态、结果、batch 与 undo/redo。

```text
业务交互
  -> Designer 字段绑定、节点 action 或 designer.execute()
  -> Authoring engine 校验 action
  -> 提交 DocumentSchema
  -> 更新 history
  -> Designer Presentation 更新画布
```

所有持久化写入都进入这条路径。保存或传输使用 `designer.exportSchema()`，不要修改 `designer.document`。
