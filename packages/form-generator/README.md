# @dragcraft/form-generator

`@dragcraft/form-generator` 是配置面板表单引擎，基于 schema 渲染属性编辑 UI（Vue3）。

## 目标

- 将配置协议抽象为 schema，不与具体业务字段耦合。
- 支持全局配置与 widget 配置双模型。
- 为 `@dragcraft/designer` 提供可替换的右侧面板实现。

## 配置面板模型

- `Global`：全局配置，始终展示。
- `Widget`：当前选中节点配置，节点切换时自动重算。

## schema 设计建议

```ts
interface FieldSchema {
	key: string
	label: string
	component: string
	props?: Record<string, unknown>
	visible?: (ctx: FormContext) => boolean
	disabled?: (ctx: FormContext) => boolean
	rules?: Array<Record<string, unknown>>
}

interface FormSchema {
	sections: Array<{
		title: string
		fields: FieldSchema[]
	}>
}
```

## 核心能力

- schema -> 表单组件映射。
- 字段联动（visible/disabled/computed）。
- 提交变更时触发 core 命令（`UPDATE_PROPS` / `SET_GLOBAL_CONFIG`）。
- 提供组件注册机制，允许替换表单控件实现。

## 与 designer 协作

- 由 designer 传入当前 `tab`、`selectedNode`、`globalConfig`。
- form-generator 仅负责渲染与收集值变更。
- 最终写操作仍由 designer 调 core 执行。

## 约束

- 不持久化业务状态。
- 不依赖具体 widget，只依赖 widget 提供的 schema。
