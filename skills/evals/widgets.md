---
id: widgets
workflows:
  - widgets
  - layout
task: 新增一个只能由模板导入、可选中配置但不能创建或复制的 Schema 托管页头物料；为其提供 root Frame 与可配置内容间距，并保持实际 NodeHost 几何与 selection/mask 命中边界正确。
evidence:
  - 物料 metadata 与 Authoring Policy 类型
  - widgets resources 和现有 Schema 托管物料
boundary:
  - 稳定 type、metadata 和 Vue 组件保持同源注册
  - Schema producer 显式提供托管节点
  - Frame 只包装完整 root NodeHost；viewport 定位属于 Frame 或 Preview 根元素，不依赖或扩张内部 NodeHost
verification:
  - 标准物料面板不显示该物料
  - 导入可解析，配置可写入，创建和复制被拒绝
  - 策略在 action 与 Designer 工作台中一致
  - content margin 的命中与 mask 跟随实际 NodeHost；root selection 的全宽视觉段不扩大实际点击范围
---

# Schema 托管业务物料
