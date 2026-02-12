# @dragcraft/designer

`@dragcraft/designer` 是 dragcraft 的唯一对外入口包。

## 对外定位

- 业务方仅需引入本包即可使用设计器。
- 本包统一导出：组件、API、类型、默认插件、默认物料。
- 内部协调 `core/renderer/form-generator/widgets`，对外屏蔽复杂度。

## 技术栈

- Vue 3（Composition API）
- 依赖 `@dragcraft/core` 作为唯一状态与命令来源

## UI 结构（左-中-右）

### 左栏：物料区

- 支持 widget 分组展示。
- 支持拖拽源创建（drag start payload 标准化）。
- 支持 `renderWidgetItem` 自定义渲染物料卡片。
- 支持读取 widget 自带 form schema 供右侧配置联动。

### 中栏：画布区

- 支持画布容器壳自定义渲染（仅容器可替换）。
- 支持物料节点在画布内的自定义渲染（`renderWidgetNode`）。
- 支持拖拽过程高亮反馈：可投放时边框高亮/背景高亮/占位提示。
- 拖拽落地通过 core 命令提交，不允许直接改 UI 本地状态。

### 右栏：配置区

- 采用 schema form 渲染。
- 固定两个 Tab：`Global` 与 `Widget`。
- `Global` 永久可见；`Widget` 依赖当前选中节点。

## 推荐公开 API

```ts
createDesigner(options): DesignerInstance
useDesigner(instance): {
	schema,
	selection,
	execute,
	undo,
	redo,
	importSchema,
	exportSchema,
	on,
	off,
}
```

## 扩展点设计

- `materialPanelRenderer`：替换左栏整体渲染。
- `canvasContainerRenderer`：替换中栏容器壳（手机壳等）。
- `widgetNodeRenderer`：替换画布内 widget 外观。
- `propertyPanelRenderer`：替换右栏配置区渲染。

## 包内依赖原则

- 对外只暴露 `@dragcraft/designer`。
- 其他包作为内部实现细节，但保持可单独开发与测试。

## 开箱即用默认能力

- 默认三栏布局。
- 默认拖拽交互与高亮态。
- 默认 widgets + 默认配置表单渲染。
- 默认导入导出 schema API。
