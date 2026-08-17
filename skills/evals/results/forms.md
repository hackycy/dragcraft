---
id: forms
workflows:
  - forms
status: passed
inputDigest: sha256:d7056a3fcfd12564219d214d574c6fef367d8c1508fe43414d41508f73c275b8
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - FieldComponentDefinition、FormSchema、bindTo 与规则公开声明
  - 自定义 Asset adapter、公告 material 字段和页面 surface 绑定示例
verification:
  - 字段转换、提交后验证与显式绑定的单元测试已覆盖
  - 页面 `style.surface` 更新在 browser smoke 中可观察
---

# 字段转换、验证与页面样式绑定

参考 Agent 只选择 forms。adapter 的 normalize、字段 parse、公开绑定目标和错误展示均有可执行路径；字段 change 先通过 AuthoringAction 提交，规则随后反馈，保存与发布仍由宿主重新校验。
