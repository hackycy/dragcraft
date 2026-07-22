---
id: integration
workflow: integration
task: 在现有 Vue 3 页面挂载一个可编辑文本物料，并提供页面标题全局配置。
evidence:
  - 项目依赖版本和锁文件
  - createDesigner() 类型
  - 快速开始与设计器接入指南
  - 现有应用入口
boundary:
  - 物料元数据、组件映射、字段映射和全局表单由宿主提供
  - Schema 写入通过公开命令或属性绑定进入设计器
verification:
  - 文本物料可以创建、选中并由右侧字段更新
  - 执行宿主类型检查或构建
---

# 最小设计器接入
