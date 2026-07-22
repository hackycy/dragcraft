---
id: forms
workflow: forms
status: passed
evidence:
  - dragcraft forms 和 widgets playbook
  - Form Generator 类型、字段指南和 Playground 字段映射
verification:
  - pnpm exec vitest run playground/src/components/fields/index.test.ts playground/src/components/widgets/basic.test.ts playground/src/config/global-config-schema.test.ts
  - pnpm typecheck、Playground 构建、git diff --check
---

# 表单结果

agent 在隔离 worktree 中注册可复用 `Asset` adapter，让图片物料以字符串字段键消费它；背景色继续使用公开 `bindTo` 写入 `root.style.surface.backgroundColor`。测试覆盖 adapter、图片 schema 和页面绑定。
