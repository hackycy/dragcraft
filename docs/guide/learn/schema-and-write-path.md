---
description: "从原有入口进入新的 Schema、命令和历史开发指南。"
---

# 理解 Schema 与写入链路

页面数据和写入保证已经拆成两个可以独立查阅的主题：

- [Schema 与样式作用域](/guide/fundamentals/schema) 说明 root、节点、样式、layout、容器状态、导入校验和 migration。
- [状态、命令、历史与事件](/guide/fundamentals/state-commands-and-history) 说明冻结快照、命令结果、no-op、拒绝、transaction 和事件。

最短的数据路径是：

```text
业务交互
  -> Designer 字段绑定、节点 action 或 engine.execute()
  -> Core 校验命令 draft
  -> 提交冻结 Schema 快照
  -> 写入历史并发出事件
  -> 设计态 Renderer 更新画布
```

所有 Schema 写入都应进入这条路径。需要保存或传输数据时调用 `exportSchema()`，不要修改 `engine.store.schema`。
