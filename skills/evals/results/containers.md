---
id: containers
workflows:
  - containers
status: passed
inputDigest: sha256:36d1aced8581094830687c7cba700f3906cff65abedca21a115f005e5a6c9550
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - ContainerDefinition、ContainerRegionOutlet 与 variant 迁移的公开声明
  - 单列双列容器、插入几何和 Runtime 容器示例
verification:
  - 容器测试覆盖容量拒绝、跨 region 移动、variant 迁移与失败原子性
  - browser smoke 覆盖 root/region 双向移动及 Region 内排序
---

# 可迁移容器与失败原子性

参考 Agent 只选择 containers。region 是子节点在 DocumentSchema 中的唯一所有者，约束和 resolver 覆盖所有放置入口；variant 迁移返回完整目标状态，显式拒绝或抛错都保持 DocumentSchema、history 和事件不变。
