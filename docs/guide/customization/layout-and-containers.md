---
description: "让业务物料拥有 region children，同时保持 Designer 的结构与拖放边界。"
---

# 容器与 Region

容器是业务物料，不是框架内置 flex 或 grid。它在 `MaterialDefinition.schema.container` 中声明 region 和容量，在自己的 preview 中决定 DOM、CSS 与子节点几何。

```ts
schema: {
  container: {
    regions: [{ id: 'content', cardinality: { max: 4 } }],
  },
},
presentation: { kind: 'visual', preview: ColumnPreview },
```

业务 preview 通过 `DesignerRegionOutlet` 将 region 放到正确的 DOM 位置。Designer 维护 `schema.structure.containers` 中的所有权与顺序，并负责 selection、drop decision、action 和 history。

## 约束

- 容器必须位于 `schema.structure.root`。
- region 只能拥有普通子节点；当前协议不支持嵌套容器。
- 容器容量、region ID 和 child owner 不满足定义时，文档进入可诊断的恢复状态，不静默丢节点。
- 业务组件不能直接修改 region children；变更始终经 Designer action。

拖放只能有一个目标：root destination 与 region destination 互斥。业务组件可以提供插入几何，Designer 负责将结果转为结构 destination。
