---
id: lifecycle
workflow: lifecycle
status: passed
evidence:
  - dragcraft lifecycle playbook
  - Schema 生命周期、保存发布、运行时指南和本地 Engine/Designer 契约
verification:
  - pnpm build:packages、pnpm -F playground build
  - pnpm -F playground exec vitest run
  - git diff --check
---

# 生命周期结果

agent 在隔离 worktree 中让宿主以 `schema:changed`、`exportSchema()` 和 `importSchema()` 管理草稿与发布，并增加只读运行时递归解释 container regions。Playground 使用 `localStorage` 演示 revision；真实生产服务仍需承担权限、资源和业务约束校验。
