---
id: containers
workflow: containers
task: 实现单列与双列之间可切换的外部容器，限定每个 region 的容量并保持子节点顺序。
evidence:
  - ContainerDefinition 和 ContainerRegionOutlet 类型
  - 容器指南、Playground 容器范例与迁移测试
boundary:
  - 子节点由 container.regions 持久化，容器组件只负责 DOM、CSS 和插入几何
  - variant 迁移返回完整目标 state
verification:
  - resolver 返回有效插入边界
  - 容量拒绝和每条变体迁移路径具备测试
---

# 可迁移双列容器
