---
id: widgets
workflows:
  - widgets
task: 新增一个只能由模板导入、可选中配置但不能创建或复制的 Schema 托管页头物料。
evidence:
  - 物料 metadata 与 Authoring Policy 类型
  - widgets resources 和现有 Schema 托管物料
boundary:
  - 稳定 type、metadata 和 Vue 组件保持同源注册
  - Schema producer 显式提供托管节点
verification:
  - 标准物料面板不显示该物料
  - 导入可解析，配置可写入，创建和复制被拒绝
  - 策略在 action 与 Designer 工作台中一致
---

# Schema 托管业务物料
