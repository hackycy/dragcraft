---
id: widgets
workflow: widgets
status: passed
evidence:
  - dragcraft widgets 和 forms playbook
  - 本地物料元数据、Core creatable 类型和 Playground 单例范例
verification:
  - pnpm exec vitest run playground/src/components/widgets/basic.test.ts
  - pnpm build:packages、Playground TypeScript 和构建、ESLint
---

# 物料结果

agent 在隔离 worktree 中新增单例公告物料。`creatable` 同时检查 root 与容器 region，组件只渲染 `props.text`，属性表单复用现有字段 adapter。测试覆盖创建限制；Vite 保留已有的大 chunk 警告。
