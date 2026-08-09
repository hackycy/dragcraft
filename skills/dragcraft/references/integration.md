# 设计器接入

读取 [integration resources](resources/integration.json)，再检查 `@dragcraft/designer` 声明和宿主 Vue 入口。

## 实施

1. 定义 `MaterialDefinition[]`，并准备字段 adapter、业务 action 和局部 Presentation 扩展。
2. 调用 `createDesigner({ schema, materials, maxHistoryEntries, fieldComponentMap })`；恢复外部输入时调用 `importSchema()` 并处理状态。
3. 由业务入口挂载 `DcDesigner`，导入字段 UI 样式与完整主题或结构 CSS。
4. 由创建实例的所有者调用 `dispose()`；页面 ID、权限、保存和路由离开保护继续由宿主持有。

## 完成标准

编辑器能够挂载和释放；至少一个已注册 material 可以创建、选中并由字段更新 Schema；导入失败不覆盖当前文档；宿主入口的类型检查或最小构建通过。
