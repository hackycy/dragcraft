---
id: integration
workflow: integration
status: passed
evidence:
  - dragcraft integration、widgets 和 forms playbook
  - 本地 Designer、Widgets 和字段 adapter 声明与指南
verification:
  - pnpm build:packages
  - pnpm exec vitest run playground/src/editor-integration.test.ts
  - pnpm build、pnpm lint、pnpm typecheck
---

# 初始接入结果

agent 在隔离 worktree 中新增公开接入测试，验证文本物料默认 props、属性字段、组件映射、字段 adapter，以及页面标题通过公开绑定写入 `globalConfig`。宿主提供四类设计器输入，属性修改保持在绑定与命令链路中。
