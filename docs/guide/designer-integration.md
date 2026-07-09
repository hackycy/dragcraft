# 集成设计器

这一页会把 `createDesigner()` 的输入项拆开讲清楚。

先看一个接近 playground 的示例：

```ts
const designer = createDesigner({
  engineOptions: {
    initialSchema: templateRegistry[0].schema,
    maxHistorySize: 50,
  },
  widgetMetas: playgroundWidgetMetas,
  componentMap: playgroundComponentMap,
  fieldComponentMap: buildPlaygroundFieldComponentMap(),
  globalConfigSchema,
})
```

上面这几个输入里，最关键的是 `widgetMetas`、`componentMap` 和 `fieldComponentMap`。它们分别决定“能拖什么”“渲染成什么”“右侧表单用什么字段组件”。

## `createDesigner()` 实际做了什么

它会创建 core engine、注册 widget meta、挂上字段 schema，并创建内置 node action registry。

这也是为什么业务侧通常只需要从 `@dragcraft/designer` 开始，而不是手动组装多个底层包。

## 什么时候读 `engine.state`

读取 schema 和交互状态时，优先通过 `engine.state`。

如果你要提交 schema 变更，统一通过 `engine.execute()`。这条边界在 architecture 文档和 `packages/core/src/engine.ts` 里都已经固定下来了。

关于标准集成方式，目前知道这些就够了。准备好之后，继续阅读 [物料与字段](/guide/materials-and-fields)。
