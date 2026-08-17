# 设计器接入

读取 [integration resources](resources/integration.json)，再检查锁文件、`@dragcraft/designer` 声明和宿主 Vue 入口。

## 实施

1. 先用 quickstart 验证 Vue、字段 adapter、Designer 样式和浏览器事件，再定义唯一的 `MaterialDefinition[]` 注册面。
2. 调用 `createDesigner({ schema, materials, fieldComponentMap, ... })`；全局表单、extensions、customActions 和 actionInterceptors 按需求显式提供。
3. 由业务入口挂载 `DcDesigner`，导入字段 UI 基础样式与 `@dragcraft/designer/standard.css`；只有实现完整主题 recipe 时才使用 `structure.css`。
4. 恢复外部输入时调用 `importSchema()` 并处理 `ready`、`degraded`、`conflicted`、`rejected`；rejected 不得覆盖当前会话。
5. 由创建实例的所有者调用 `dispose()`；页面 ID、权限、保存和路由离开保护继续由宿主持有。

## 完成标准

编辑器能够挂载和释放；至少一个已注册 material 可以创建、选中并由字段更新 Schema；导入失败不覆盖当前文档；业务只导入公开聚合 package；宿主入口的类型检查或最小构建通过。
