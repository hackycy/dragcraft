---
id: forms
workflows:
  - forms
task: 为公告物料添加带转换和验证的自定义字段 adapter，使用 ifShow 控制依赖字段，并将页面背景色显式绑定到 surface 样式。
evidence:
  - 字段 adapter、FormSchema、ifShow、bindTo 和规则类型
  - forms resources 与现有字段映射
boundary:
  - 字符串字段键连接 FormSchema 与 fieldComponentMap
  - 页面视觉使用显式 schema bindTo；ifShow 隐藏字段但不清空已保存值
  - 字段规则提供提交后的编辑反馈，保存与发布由宿主重新校验
verification:
  - model prop、更新事件和转换后的值一致
  - 无效值提交转换结果并显示字段错误，历史与实际 change 一致
  - 公告写入节点 props，背景色写入 root.style.surface
---

# 字段转换、验证与页面样式绑定
