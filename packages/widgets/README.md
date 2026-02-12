# @dragcraft/widgets

`@dragcraft/widgets` 提供默认物料集合与物料协议定义。

## 目标

- 提供可直接使用的基础 widget（如 Button、Image、Text）。
- 支持分组管理，便于左栏物料区分类展示。
- 每个 widget 内置 form schema，用于右栏配置。

## widget 协议建议

```ts
interface WidgetMeta {
  type: string
  title: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  formSchema: Record<string, unknown>
  canHaveChildren?: boolean
}
```

## 分组机制

- `basic`：基础展示组件
- `form`：表单交互组件
- `layout`：布局类组件
- `business`：业务扩展组件

> 分组字段可由业务方扩展，designer 左栏根据 group 自动聚合。

## 渲染配合

- 左栏：提供物料卡片元信息与拖拽描述信息。
- 画布：提供默认展示组件（可被用户自定义渲染覆盖）。

## 与 core 协作

- 启动阶段向 registry 注册 widget 元信息。
- 通过 `type` 保持 schema 与渲染映射一致。
