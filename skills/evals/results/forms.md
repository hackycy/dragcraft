---
id: forms
workflows:
  - forms
status: passed
inputDigest: sha256:96e43aa09032bfd4e85446975fcbdec342214f784bce425c121deefe84195d1a
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - FieldComponentDefinition、FormSchema、bindTo 与规则公开声明
  - 自定义 Asset adapter、公告字段和页面 surface 绑定示例
verification:
  - 字段转换顺序与提交后验证测试通过
  - surface 读取和根节点 style patch 测试通过
---

# 字段转换、验证与页面样式绑定

参考 Agent 只选择 forms。adapter 的 normalize、字段 parse、公开绑定目标和错误展示均有可执行路径；结果明确记录字段 change 先提交、规则随后反馈，保存与发布由宿主重新校验，不把表单规则误写成提交门控。
