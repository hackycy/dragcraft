---
id: widgets
workflows:
  - widgets
status: passed
inputDigest: sha256:489394d830aab45cbd63f64eb45673e0329668fd46537e19017965abc8aa206f
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - MaterialDefinition 与 Authoring Policy 的 Designer 公开声明
  - Schema 托管页头、单一 material 定义与初始 DocumentSchema 示例
verification:
  - policy 覆盖创建、复制、移动、删除与更新的可观察结果
  - browser smoke 覆盖策略拒绝、模板切换和 Headless material 创建
---

# Schema 托管业务物料

参考 Agent 只选择 widgets。`MaterialDefinition.authoring` 对 Schema 托管页头固定创建与复制边界，模板 DocumentSchema 提供稳定节点；选择和配置能力显式开放，拒绝路径不写入 DocumentSchema、history 或事件。
