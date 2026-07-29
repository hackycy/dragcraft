# 设计器接入

读取 [integration resources](resources/integration.json)，再检查 `@dragcraft/designer` 声明和宿主 Vue 入口。

## 实施

1. 先注册字段 adapter、物料定义、动作、扩展点和 Schema migration，再导入依赖这些注册项的 Schema。
2. 为 `createDesigner()` 提供物料元数据、组件映射、字段组件映射，以及任务需要的页面级配置。无需额外 migration 时可把初始 Schema 放入 `engineOptions`；需要先注册宿主 migration 时，先创建实例并注册，再手动 `importSchema()`。历史配置仍归入 `engineOptions`。
3. 由业务入口挂载 `DcDesigner`，导入匹配字段 adapter 的 UI 样式，以及完整主题或结构 CSS。
4. 由创建实例的所有者调用 `dispose()`；页面 ID、权限、保存和路由离开保护继续由宿主持有。

## 完成标准

编辑器能够挂载和释放；至少一个已注册物料可以创建、选中并由字段更新 Schema；导入发生在依赖注册完成后；宿主入口的类型检查或最小构建通过。
