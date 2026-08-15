# 外部容器物料

读取 [containers resources](resources/containers.json)，再确定 region 所有权、业务 DOM 和插入几何的边界。

## 实施

1. 以 `MaterialDefinition.schema.container.regions` 声明稳定 Region ID，并将物料注册给 Designer。
2. 容器组件提供 DOM、CSS 和插入几何，通过 `DesignerRegionOutlet` 渲染 Region；resolver 返回有效整数边界或 `null`。
3. 静态容量和类型规则放入 Region 声明；业务组件不维护第二套结构状态。
4. Region 集合是声明式且固定的；结构变更通过 `DocumentSchema` 和 Authoring Action 完成，不在 Presentation 中迁移。
5. 子节点只存在于 `DocumentSchema.structure.containers`，普通节点和容器组件不自行维护第二份 children。

## 完成标准

测试覆盖插入边界、跨 Region 移动、容量或类型拒绝，以及子节点顺序与所有权。
