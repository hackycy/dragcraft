---
id: containers
workflows:
  - containers
status: passed
inputDigest: sha256:f4854c5654809ea1453b4a3f5b391f89996541740ddb41fa27b832d3bbb60aec
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - ContainerDefinition、ContainerRegionOutlet 与迁移结果公开声明
  - 单列双列容器、插入几何和运行时容器示例
verification:
  - 相关容器、编辑器与运行时 9 项测试通过
  - 黑盒验收覆盖容量拒绝、双向迁移、抛错及 Schema/history/event 原子性
---

# 可迁移容器与失败原子性

参考 Agent 只选择 containers。region 是子节点唯一所有者，约束和 resolver 覆盖所有放置入口；迁移返回完整新 state，显式拒绝或抛错都保持 Schema、history 和事件不变。
