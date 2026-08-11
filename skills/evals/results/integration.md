---
id: integration
workflows:
  - integration
  - widgets
  - forms
status: passed
inputDigest: sha256:343a8e592eb5f5096ffe1685fe6e3b6fd7b98e84047861387beccd79a4839491
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - "`@dragcraft/designer` 与字段 adapter 的公开 exports 和 package 声明"
  - 最小 Designer、文本 MaterialDefinition、字段 adapter 与 Vue 挂载示例
verification:
  - Guide Project 只导入 Designer、Device Frames 和字段 adapter
  - Chromium 运行中 Guide Project 的 Device Frame 投影断言通过
---

# 最小设计器接入

参考 Agent 选择 integration 为主工作流，并加载 widgets 与 forms 作为直接依赖。实例通过 `createDesigner({ schema, materials, fieldComponentMap })` 组装；`MaterialDefinition[]` 是唯一物料注册面，实例释放、页面状态和持久化仍由宿主负责。
