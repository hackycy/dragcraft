---
id: containers
workflows:
  - containers
task: 实现单列与双列可切换的外部容器，限制 region 容量，并保证失败迁移不会部分修改 Schema。
evidence:
  - ContainerDefinition、ContainerRegionOutlet 和迁移类型
  - containers resources 与现有迁移测试
boundary:
  - 子节点只由 container.regions 持久化
  - 容器组件负责 DOM、CSS 和插入几何
verification:
  - resolver 返回有效插入边界
  - 测试覆盖容量拒绝、跨 region 移动和双向迁移
  - 迁移拒绝或抛错保持 Schema 与历史不变
---

# 可迁移容器与失败原子性
