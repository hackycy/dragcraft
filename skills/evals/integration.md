---
id: integration
workflows:
  - integration
  - widgets
  - forms
task: 在现有 Vue 页面挂载最小 DragCraft 编辑器，注册文本物料和页面标题配置，并正确管理实例生命周期。
evidence:
  - 项目依赖、锁文件和公开 package 声明
  - 根 skill 的路由与 integration resources
  - 现有 Vue 入口和最小编辑器示例
boundary:
  - 注册发生在依赖它的 Schema 导入之前
  - 宿主持有页面状态并释放 Designer 实例
verification:
  - 文本物料可创建、选中并由字段更新
  - 页面标题写入 globalConfig
  - 宿主类型检查或最小构建通过
---

# 最小设计器接入
