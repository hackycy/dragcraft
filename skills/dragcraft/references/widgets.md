# 普通物料

## 证据链

读取物料指南、`@dragcraft/widgets` 与 `@dragcraft/designer` 的声明，并在 Playground 中找到同类组件。确定现有物料注册表和类型命名约定。

## 实施

1. 为每个稳定的 Schema `type` 共置元数据和 Vue 组件；使用项目已有的 `WidgetDefinition`、`getWidgetMetas()` 与 `buildComponentMap()` 组合方式。
2. 在 meta 中定义默认 props、物料说明、`formSchema`、默认布局和创建/选择/拖拽/排序/删除约束；让每个入口接受同一组行为规则。
3. 将组件本身限制为业务展示，物料元数据负责创建协议和设计器配置。
4. 当组件需要独立子区域时，转到容器工作流，不把该需求编码为普通节点的自定义 children。

## 完成

确认 `type` 可由组件映射解析，拖入后的默认 props 与表单修改一致，行为约束在所有创建入口生效。为新约束或转换补充可观察的测试。
