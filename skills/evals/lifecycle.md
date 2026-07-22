---
id: lifecycle
workflow: lifecycle
task: 为设计页增加草稿保存和发布，并让生产页面渲染已发布的容器 Schema。
evidence:
  - Schema 生命周期、保存发布和运行时指南
  - 宿主 API 与 revision 约定
boundary:
  - 保存由 schema:changed 驱动，宿主管理版本与冲突
  - 生产运行时只读解释 container.regions，不复用编辑交互
verification:
  - 保存失败保留未保存状态，冲突不覆盖远端草稿
  - 验证运行时未知物料的可观测降级或阻断
---

# 草稿发布与生产运行时
