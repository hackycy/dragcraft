# 外部容器物料

读取 [containers resources](resources/containers.json)，再确定 Schema owner、Region 能力、业务 DOM 和插入几何的边界。

## 实施

1. 以 `MaterialDefinition.schema.container.regions` 声明稳定 Region ID、`cardinality` 和 `accepts.types`，并将物料注册给 Designer。
2. 容器节点必须是 `structure.root` 的直接成员；子节点只存在于 `structure.containers[containerId].regions[regionId]`，当前协议不把容器再放入 Region。
3. 容器组件提供 DOM、CSS 和插入几何，通过 `DesignerRegionOutlet` 渲染 Region；resolver 接收事件、Region 元素、直接子元素和只读 nodes，返回有效整数边界或 `null`。
4. resolver 只负责几何；容量、accepted types、policy、owner 和 history 由 Designer 统一检查，业务组件不维护第二套结构状态。
5. 每个声明 Region 只渲染一个 outlet；需要标题或统计时只读使用 `useContainerRuntime()`，不要从 runtime 自己渲染 NodeHost。
6. Region 集合是声明式且固定的；结构变更通过 `DocumentSchema` 和 Authoring Action 完成，不在 Presentation 中迁移。

## 完成标准

测试覆盖插入边界、跨 Region 移动、容量或类型拒绝、missing/duplicate outlet recovery，以及子节点顺序与所有权；resolver 缺失、抛错、非法 index 和无目标都要有可观察诊断。
