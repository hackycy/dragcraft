---
id: lifecycle
workflows:
  - lifecycle
status: passed
inputDigest: sha256:cb55e01a1acaf1acab8549afcb72ca6c672e81bdfe01ccf7eb3b8002a58ccb64
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - import/export 结果、diagnostics 与 DocumentSchema 的公开声明
  - revision 仓储、Runtime type map 与 RuntimePage 示例
verification:
  - 草稿隔离和 revision 冲突测试已覆盖
  - Runtime 容器所有权、样式作用域与未知 type fallback 已覆盖
---

# Schema 生命周期与生产运行时

参考 Agent 只选择 lifecycle。material 准备、导入 diagnostics、草稿乐观锁和发布边界由宿主明确持有；独立 Runtime 按 type 解释容器，并对未知 type 输出包含节点 ID 的可观察 fallback。
