---
id: commands
workflows:
  - commands
status: passed
inputDigest: sha256:771bf510d8a868dfb0b2fdcc632825e178ed73e9259ff76135ddea97f762f7d6
executedAt: "2026-08-20T09:14:20Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - "`AuthoringAction`、结果、history 与 `designer.document` 的公开状态观察契约"
  - 业务 action、节点语义 action、Guide Project 的 document watch 与原子 history 测试
verification:
  - "`committed`、`unchanged`、`rejected` 与 `confirmation-required` 的结果语义均有覆盖"
  - "`watch(designer.document)` 观察成功写入；no-op、拒绝和取消确认不写入 history 或 document"
---

# AuthoringAction 结果与历史原子性

参考 Agent 只选择 commands。方案区分核心 Schema action 与节点语义 action，并以 `designer.execute(action)` 的判别结果区分 `committed`、`unchanged`、`rejected` 与 `confirmation-required`；只有实际变更 DocumentSchema 的 action 进入 history，宿主通过 `watch(designer.document)` 观察公开状态。
