---
id: commands
workflows:
  - commands
status: passed
inputDigest: sha256:e86480577dda717cd1635a089d47b0037429ad090e14cd28110f7d0f0b5c404d
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - designer 公开命令、事件与 history 声明
  - 业务动作、命令总线和三态结果测试
verification:
  - 宿主命令结果测试 4 项通过
  - Core command bus 17 项及 Renderer 动作相关 10 项测试通过
---

# 命令结果与历史原子性

参考 Agent 只选择 commands。方案用 `execute()` 的判别结果区分 success、no-op 和 rejected，并确认只有 `ok && changed` 写入历史和发出 `schema:changed`；未公开的结果类型没有被当成可命名导入。
