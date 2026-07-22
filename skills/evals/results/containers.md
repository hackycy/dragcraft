---
id: containers
workflow: containers
status: passed
evidence:
  - dragcraft containers playbook
  - 容器指南、Core/Renderer 参考和 Playground 容器实现
verification:
  - pnpm exec vitest run playground/src/components/widgets/container.test.ts
  - pnpm build、pnpm lint、pnpm typecheck、git diff --check
---

# 容器结果

agent 在隔离 worktree 中实现单列与双列外部容器。物料定义负责 variants、capacity、迁移和插入几何；Core 保持命令、校验与历史所有权，Renderer 通过 `ContainerRegionOutlet` 渲染 region。测试覆盖容量、顺序和双向迁移。
