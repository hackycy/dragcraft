---
id: containers
workflows:
  - containers
status: passed
inputDigest: sha256:152d22e6a7f98ef90ac9f5750e941685baf686cbe18c2a8d3bf3d5488e34e912
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - MaterialDefinition、DesignerRegionOutlet、useContainerRuntime 与 drop diagnostic 的公开声明
  - 单列双列容器、插入几何和 Runtime 容器示例
verification:
  - 容器测试覆盖容量/type 拒绝、跨 region 移动、resolver 诊断、outlet recovery 与失败原子性
  - browser smoke 覆盖 root/region 双向移动及 Region 内排序
---

# Region 容器与失败原子性

参考 Agent 只选择 containers。Region 是子节点在 DocumentSchema 中的唯一所有者，约束和 resolver 覆盖所有放置入口；missing/duplicate outlet 和非法 resolver 都进入可观察 recovery/diagnostic，显式拒绝或抛错都保持 DocumentSchema、history 和事件不变。
