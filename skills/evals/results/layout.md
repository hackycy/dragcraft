---
id: layout
workflows:
  - layout
status: passed
inputDigest: sha256:242290f46d6aaf0d366414600933df56d73d5db0f92a93fed6da67394cf0f2e1
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - SchemaNode 布局与样式公开声明
  - 初始 Schema、运行时 layout、RuntimePage 与递归容器示例
verification:
  - 运行时布局与 RuntimePage 5 项测试通过
  - 额外断言覆盖稳定排序、predicate 可见性与 fixed inset
---

# 布局投影与参考运行时

参考 Agent 只选择 layout。方案按 flow region、chrome edge 和 layer 分域稳定排序，区分设计态隐藏轮廓与生产运行时跳过，并把 container、content、surface 样式交给各自所有者；宿主运行时没有复用编辑器 Renderer。
