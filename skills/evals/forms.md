---
id: forms
workflow: forms
task: 为图片物料添加可复用资源选择字段，并为页面配置背景色。
evidence:
  - 字段 adapter 类型
  - 字段指南、现有字段映射和全局配置范例
boundary:
  - 复用字段由字符串键和 fieldComponentMap 连接
  - 非默认 Schema 位置使用明确 bindTo
verification:
  - model prop 与更新事件匹配组件
  - 图片写入节点 props，背景色写入页面样式，并验证值变化
---

# 资源字段与页面样式绑定
