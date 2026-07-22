# 设计器接入

## 证据链

阅读 source map 中的接入指南、`@dragcraft/designer` 声明和宿主应用入口。确认 Vue、主题、字段 UI 库与 DragCraft 的实际版本。

## 实施

1. 为 `createDesigner()` 准备物料元数据、组件映射、字段组件映射和需要时的页面级 `globalConfigSchema`；初始 Schema 与历史配置归入 `engineOptions`。
2. 由业务入口挂载 `DcDesigner`，导入与字段 adapter 匹配的 UI 样式，以及 DragCraft 的完整主题或结构 CSS。
3. 读取页面快照使用 `engine.state` 或 `useDesigner()`；业务写入使用 `execute()`，让命令、历史和事件保持一致。
4. 将页面 ID、权限、保存按钮和路由离开保护保留在宿主页面，而不是设计器基础布局。

## 完成

确认一个物料能创建、选中并通过右侧字段更新 Schema。运行宿主的类型检查和最贴近入口的测试或构建。
