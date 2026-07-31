---
id: integration
workflows:
  - integration
  - widgets
  - forms
status: passed
inputDigest: sha256:78a6906fe82bbbfc18c7d5d3c7acec9f3ff0e75db687d578dc6854201e9ceca2
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - 已安装 designer 与字段 adapter 的公开导出和声明
  - 最小编辑器、文本物料、全局配置与 Vue 挂载示例
verification:
  - 注册表和初始 Schema 的导入顺序通过现有宿主测试
  - guide-project 类型检查与构建入口可执行
---

# 最小设计器接入

参考 Agent 选择 integration 为主工作流，并加载 widgets 与 forms 作为直接依赖。实现只从公开 package 导入，区分了可直接放入 `engineOptions` 的初始 Schema 与需要先注册 migration 再手动导入的路径，同时把实例释放、页面状态和持久化责任留给宿主。
