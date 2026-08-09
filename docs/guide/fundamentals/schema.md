---
description: "理解 DocumentSchema、节点所有权、导入状态和生产运行时边界。"
---

# DocumentSchema

DocumentSchema 是编辑器、持久化服务和生产运行时共享的纯数据。它不包含 Vue 组件、选择、拖拽或 history。

```ts
interface DocumentSchema {
  version: string
  globalConfig: JsonObject
  page: PageDefinition
  nodes: NodeDefinition[]
  structure: {
    root: NodeId[]
    containers: Record<NodeId, ContainerStructure>
  }
}
```

`nodes` 保存节点对象，`structure.root` 保存页面级顺序，`structure.containers` 保存容器 region 的所有权和顺序。节点 `type` 是跨端稳定语义键；每个节点 `id` 只在当前文档中唯一。

## 容器所有权

容器直接位于 `structure.root`。容器 region 中的普通节点由对应 `ContainerStructure` 持有，不再进入页面级排序。当前协议不支持容器嵌套。

业务容器组件只决定自己的 DOM、CSS 和 children 几何；Schema 结构、选择、拖放决策和 history 仍由 Designer 管理。

## 导入与恢复

`designer.importSchema(input)` 使用与初始 schema 相同的解析管线：

- `ready`：当前 materials 完整支持该文档。
- `degraded`：未知 type 被保留为只读 fallback。
- `conflicted`：保留数据，但限制受影响的结构写入。
- `rejected`：输入不安装，当前文档保持不变。

导出通过 `designer.exportSchema()` 返回可 JSON round-trip 的独立数据。DragCraft 不提供旧 Schema 的运行时迁移或兼容别名；版本演进由宿主在导入前离线处理。

## 保存前检查

- 每个节点 ID 唯一，type 在发布白名单内。
- props、资源 URL 和 `globalConfig` 符合业务协议。
- 容器 region 与容量满足当前 material 声明。
- 未知 type、conflict 和 rejected 都有明确的宿主处理策略。

写入这份数据时使用 `designer.execute(action)`。历史保证见 [状态、动作与历史](/guide/fundamentals/state-commands-and-history)。
