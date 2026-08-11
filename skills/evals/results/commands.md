---
id: commands
workflows:
  - commands
status: passed
inputDigest: sha256:fcedc032f73b55ebdb0ff32c7b55411f9f5e75e145011f41af31a15d9cceb479
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - "`AuthoringAction`、结果、事件与 history 的 Designer 公开声明"
  - 业务 action、Authoring Engine 与原子 history 测试
verification:
  - "`committed`、`unchanged`、`rejected` 与 `confirmation-required` 的结果语义均有覆盖"
  - browser smoke 覆盖原子 history、undo/redo 与拒绝 drop 不写入 history
---

# AuthoringAction 结果与历史原子性

参考 Agent 只选择 commands。方案以 `designer.execute(action)` 的判别结果区分 `committed`、`unchanged`、`rejected` 与 `confirmation-required`；只有实际变更 DocumentSchema 的 action 进入 history 并发出 `schema:changed`。
