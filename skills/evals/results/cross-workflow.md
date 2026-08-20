---
id: cross-workflow
workflows:
  - widgets
  - forms
  - commands
status: passed
inputDigest: sha256:8a1ad338cda3edaf4936be2a7b2e32ed85a674d580e9b653a6f3cd4b3e4f7da8
executedAt: "2026-08-20T09:14:20Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - MaterialDefinition、字段 adapter、AuthoringAction 与 interceptor 公开声明
  - 现有 material、表单、确认 action 与结果状态测试
verification:
  - 路由仅加载 widgets、forms 与 commands
  - 单例拒绝和取消确认无副作用，字段错误遵循提交后反馈语义；宿主通过 `designer.document` 观察写入
---

# 跨工作流优惠券物料

参考 Agent 选择 widgets 为主工作流，forms 与 commands 为直接依赖。单例约束覆盖创建入口，取消确认不执行 AuthoringAction，成功重置形成一个事务；无效优惠码提交转换值并显示错误，保存和发布阶段负责最终阻断，写入由 `designer.document` 的公开状态观察。
