---
id: cross-workflow
workflows:
  - widgets
  - forms
  - commands
status: passed
inputDigest: sha256:efbaa0ae478bd1021773796fa9eaa8955295df51cf7b8548e414c5d98c33acac
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - 物料能力、字段 adapter、动作、interceptor 和命令公开声明
  - 现有物料、表单、确认动作与三态命令测试
verification:
  - 路由仅加载 widgets、forms 与 commands
  - 单例拒绝和取消确认无副作用，字段错误遵循提交后反馈语义
---

# 跨工作流优惠券物料

参考 Agent 选择 widgets 为主工作流，forms 与 commands 为直接依赖。单例约束覆盖创建入口，取消确认不执行命令，成功重置形成一个事务；无效优惠码提交转换值并显示错误，保存和发布阶段负责最终阻断。
