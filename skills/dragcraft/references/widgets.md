# 业务物料与 Authoring Policy

读取 [widgets resources](resources/widgets.json)，再检查现有物料注册表、Schema producer 和稳定 `type` 命名。

## 实施

1. 共置物料 metadata 与 Vue 组件，并复用宿主已有的 `WidgetDefinition`、`getWidgetMetas()` 和 `buildComponentMap()` 组合方式。
2. 普通物料定义默认 props、表单、默认布局、物料说明和需要的创建/选择/拖拽/排序/删除约束。
3. 只能由模板、导入或 migration 引入的物料使用 `authoring: 'schema-managed'`，并由 Schema producer 显式提供节点。
4. 用能力 override 表达 Schema 托管物料的选择、配置、排序和移动策略；创建与复制保持由框架拒绝。
5. 组件负责业务展示，metadata 负责设计协议。需要独立子区域时转到容器工作流。

## 完成标准

每个稳定 `type` 同时存在 metadata 与组件映射；默认 props、表单值和创建约束一致；Schema 托管物料可由导入解析且不会从标准入口创建；新增策略具备可观察测试。
