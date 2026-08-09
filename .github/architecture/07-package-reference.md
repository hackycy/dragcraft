# 包职责索引

只有以下 package 是业务应用可直接使用的支持面。

| Package | 用途 |
| --- | --- |
| `@dragcraft/designer` | 创建 Designer、挂载工作台、定义物料、访问 Schema 与设计态 Presentation 扩展。 |
| `@dragcraft/device-frames` | 提供可选 Device Frame definitions、picker 与 Container Shell。 |
| `@dragcraft/fields-*` | 提供特定 UI 库的字段 adapter；当前包括 Ant Design Vue。 |

## @dragcraft/designer

主要入口：

- `createDesigner({ schema?, materials, maxHistoryEntries?, ... })`
- `DcDesigner`、`useDesigner()`
- `MaterialDefinition`、`defineMaterial()`、`DocumentSchema`
- `AuthoringAction`、`AuthoringResult`、`SchemaLoadResult`
- `DesignerExtensions`、`ContainerRegionOutlet`、node action 和 event hook 类型
- `@dragcraft/designer/standard.css` 与 `@dragcraft/designer/structure.css`

`DesignerInstance` 只暴露 document、selection、history、execute、import/export、locale 与 dispose。内部运行模块不属于业务 API。

## @dragcraft/device-frames

Device Frame 提供纯 definition、Container Shell 和选择控件。Shell 只包围业务预览 slot；它不读取或写入 DocumentSchema，也不拥有 Designer 的拖拽、选择或工具栏 Presentation。

## @dragcraft/fields-*

字段 adapter 将真实 UI 控件映射为 `FieldComponentMap` 的条目。业务可以把自定义字段与 `createAntDesignVueFields()` 的返回值合并，再通过 `fieldComponentMap` 交给 Designer。

## 内部实现

领域解析、authoring、表单运行时、基础 UI、国际化和通用函数都由 Designer 组合。它们可以作为传递依赖存在，但业务应用、公开示例和文档不直接导入。
