---
id: forms
workflows:
  - forms
status: passed
inputDigest: sha256:262be29cdfc95be083c2ba3ef331c1c29113115ab5dcb1d184fd7a2869cc61a8
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - FieldComponentDefinition、FormSchema、ifShow、bindTo 与规则公开声明
  - 自定义 Asset adapter、公告 material 字段和页面 surface 绑定示例
verification:
  - 字段转换、提交后验证与显式绑定的单元测试已覆盖
  - 页面 `style.surface` 更新和 ifShow 保值语义在 browser smoke 中可观察
---

# 字段转换、验证与页面样式绑定

参考 Agent 只选择 forms。adapter 的 normalize、字段 parse、ifShow、公开绑定目标和错误展示均有可执行路径；字段 change 先通过 AuthoringAction 提交，规则随后反馈，隐藏字段不会清空已保存值，保存与发布仍由宿主重新校验。
