# 外部容器物料

## 证据链

读取容器指南、Core 与 Renderer 的容器协议，并参考 Playground 的 `container.ts` 和迁移测试。先确定根布局、region 结构和业务几何分别由谁负责。

## 实施

1. 以 `ContainerDefinition` 声明稳定的 variant 与 region ID；使用 `defineContainerWidget()` 注册容器物料。
2. 由容器组件提供 DOM、CSS 和插入几何，并通过 `ContainerRegionOutlet` 渲染每个 region。drop index resolver 返回可验证的整数边界或 `null`。
3. 将静态容量和类型规则放入 region constraints，将依赖候选节点或页面状态的规则放入 `canPlace`。
4. 当 variant 改变 region 集合时，实现 `migrateVariant` 并返回完整目标 state；把表单 variant 字段绑定到 `container.variant`。

## 完成

确认容器节点仍是 root 节点、普通子节点位于 `container.regions`，拖放与跨 region 移动遵守约束。为插入边界、容量拒绝和每条变体迁移路径编写测试。
