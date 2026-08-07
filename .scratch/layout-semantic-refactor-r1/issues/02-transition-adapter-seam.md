Status: resolved
Type: grilling
Blocked by: 01

## Question

在新 Core/Authoring 接入期间，现有 Renderer 与 Designer 工作台应通过什么最小过渡 Adapter 接口读取文档、派发操作和订阅会话状态，才能保持画布交互不变，同时保证 Adapter 可在切换完成后删除？

## Answer

不采用“新 Authoring Engine 模拟完整旧 `DesignerEngine`”的方向。旧 UI 实际跨越 `store`、`state`、`registry`、旧 `Command`、`history`、`eventHub`、`LayoutPlan`、容器计划和排序约束；把这些全部伪装出来会形成第二套运行时，临时 Adapter 也会变成难以删除的浅层 facade。

采用最终内部 `DesignerSession` interface 作为唯一长期 seam：

- 只读文档查询：节点、owner、root/Region 顺序和容器事实。
- 物料与展示查询：节点类型对应的设计态展示与 authoring capability。
- 会话状态：selection、hover、drag target、history 以及清理/修复后的连续快照。
- 写入入口：`evaluate(action)` 与 `execute(action)`；UI 不构造 Core Schema Operation。

迁移顺序为：

```text
旧 Engine
  -> 临时旧 Engine Adapter
  -> DesignerSession interface
  <- 新 Authoring Engine
```

临时 Adapter 由旧 Engine 实现 `DesignerSession`，而不是让新 Authoring Engine 实现旧 Engine。未迁移和已迁移的 UI 在过渡期共享同一个旧状态源，不双写、不运行两套 Schema。Canvas、拖放、结构树、属性面板和工作台控制按调用簇逐个迁移，每个调用簇通过交互基线后再继续。

当所有 UI 调用方只依赖 `DesignerSession` 后，接入新 Authoring Engine 作为该 interface 的实现；最终删除旧 Engine Adapter、旧 Engine 类型和旧 Core 协议。该 Adapter 只存在于重构分支内部，不进入公共导出，也不提供长期兼容语义。
