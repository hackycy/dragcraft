---
id: commands
workflows:
  - commands
status: passed
inputDigest: sha256:cccedbd2d2f5715c6e8af7930aa77297a194ab2cab78e9f083dc66deb71efb23
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - "`AuthoringAction`、结果、事件与 history 的 Designer 公开声明"
  - 业务 action、节点语义 action、Authoring Engine 与原子 history 测试
verification:
  - "`committed`、`unchanged`、`rejected` 与 `confirmation-required` 的结果语义均有覆盖"
  - browser smoke 覆盖原子 history、undo/redo 与拒绝 drop 不写入 history
---

# AuthoringAction 结果与历史原子性

参考 Agent 只选择 commands。方案区分核心 Schema action 与节点语义 action，并以 `designer.execute(action)` 的判别结果区分 `committed`、`unchanged`、`rejected` 与 `confirmation-required`；只有实际变更 DocumentSchema 的 action 进入 history 并发出 `schema:changed`。
