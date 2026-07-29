# 外部容器物料

读取 [containers resources](resources/containers.json)，再确定 region 所有权、业务 DOM 和插入几何的边界。

## 实施

1. 以 `ContainerDefinition` 声明稳定 variant 与 region ID，并使用 `defineContainerWidget()` 注册容器物料。
2. 容器组件提供 DOM、CSS 和插入几何，通过 `ContainerRegionOutlet` 渲染 region；resolver 返回有效整数边界或 `null`。
3. 静态容量和类型规则放入 region constraints；依赖候选节点或页面状态的规则放入 `canPlace`。
4. variant 改变 region 集合时，`migrateVariant` 返回完整目标 state；迁移被拒绝或抛错时保持原容器与历史不变。
5. 子节点只存在于 `container.regions`，普通节点和容器组件不自行维护第二份 children。

## 完成标准

测试覆盖插入边界、跨 region 移动、容量或类型拒绝、所有变体迁移路径和失败原子性；迁移后子节点顺序与所有权保持明确。
