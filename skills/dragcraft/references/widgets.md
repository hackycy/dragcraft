# 业务物料与 Schema 托管物料

## 证据链

读取物料指南、动作与业务策略、`@dragcraft/designer` 的声明，并在 Playground 或范例中找到同类组件。确定现有物料注册表、Schema producer 和类型命名约定。

## 实施

1. 为每个稳定的 Schema `type` 共置元数据和 Vue 组件；使用项目已有的 `WidgetDefinition`、`getWidgetMetas()` 与 `buildComponentMap()` 组合方式。
2. 普通物料在 meta 中定义默认 props、物料说明、`formSchema`、默认布局和创建/选择/拖拽/排序/删除约束；让每个入口接受同一组行为规则。
3. 对只能由模板、import 或 migration 引入的物料，使用 `authoring: 'schema-managed'`，并在同一改动中确认 Schema producer 显式提供节点。不要用 `creatable: false` 代替：Schema 托管还会禁止 duplicate、隐藏标准物料面板并投影既有实例的操作策略。
4. Schema 托管默认允许选中、props/style 配置和 sibling 排序；拒绝移动、删除和容器 variant。需要移动时显式设为 `draggable: true`；只有需要锁住绝对 sibling 下标时才设为 `sortable: false`。创建与复制不允许覆盖。内置工具栏操作默认保留为 disabled，`actions.only`、`actions.exclude` 和 `visible` 才控制显隐。
5. 将组件本身限制为业务展示，物料元数据负责创建协议和设计器配置。
6. 当组件需要独立子区域时，转到容器工作流，不把该需求编码为普通节点的自定义 children。

## 完成

确认 `type` 可由组件映射解析，拖入后的默认 props 与表单修改一致，行为约束在所有创建入口生效。对于 Schema 托管物料，确认它不出现在标准物料面板、初始/导入 Schema 可解析、duplicate 被拒绝，且每个显式能力 override 同时在命令与工作台生效。为新约束或转换补充可观察的测试。
