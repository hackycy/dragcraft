---
id: lifecycle
workflows:
  - lifecycle
task: 接入 Schema migration、带 revision 的草稿仓储和独立 Vue 运行时，并为未知物料提供可观察降级。
evidence:
  - 导入、migration、Schema 事件和公开类型
  - lifecycle resources、仓储与运行时示例
boundary:
  - migration 与物料在导入前完成注册
  - 宿主管理草稿冲突与发布，运行时只读消费 Schema
verification:
  - 测试覆盖 migration、导入诊断、保存失败和 revision 冲突
  - 容器递归与样式作用域正确
  - 未知物料显示 type 与节点 ID
---

# Schema 生命周期与生产运行时
