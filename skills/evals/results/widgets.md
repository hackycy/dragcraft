---
id: widgets
workflows:
  - widgets
status: passed
inputDigest: sha256:b51f905a8b5c819e6db2dff1319ca7131b33f4964efd88e238746b5b2c42b1f8
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - WidgetDefinition、DesignerWidgetMeta 与 Authoring Policy 公开声明
  - Schema 托管页头、同源注册与初始 Schema 示例
verification:
  - 相关物料与策略测试 108 项通过
  - 黑盒验收覆盖模板导入、创建复制拒绝、配置成功、history 与事件
---

# Schema 托管业务物料

参考 Agent 只选择 widgets。`authoring: schema-managed` 负责不可解除的创建与复制边界，模板 Schema 提供稳定节点；选择和配置能力显式开放，拒绝路径不写 Schema、history 或事件。
