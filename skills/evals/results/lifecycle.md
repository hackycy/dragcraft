---
id: lifecycle
workflows:
  - lifecycle
status: passed
inputDigest: sha256:11403c1ca5f97c43c72dd213aaf77f64b00791ba59032a6b32c4f40c6d191301
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - DesignerEngine migration、导入结果与 Schema 公开声明
  - migration、revision 仓储、运行时 registry 与 RuntimePage 示例
verification:
  - 草稿隔离和 revision 冲突测试通过
  - 运行时递归、样式作用域与未知物料 fallback 测试通过
---

# Schema 生命周期与生产运行时

参考 Agent 只选择 lifecycle。注册顺序、导入诊断、草稿乐观锁和发布边界由宿主明确持有；独立运行时使用判别 registry 递归容器，并对未知 type 输出包含节点 ID 的可观察 fallback。
