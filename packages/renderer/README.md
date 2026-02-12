# @dragcraft/renderer

`@dragcraft/renderer` 负责将 core 的 schema 节点渲染为 Vue 组件树。

## 目标

- 将数据结构稳定映射为可视组件。
- 支持容器与 widget 的分层渲染。
- 支持可替换渲染策略，不破坏 schema 协议。

## 渲染分层

1. RootRenderer：根节点入口。
2. ContainerRenderer：容器节点渲染（可自定义容器壳）。
3. WidgetRenderer：普通物料节点渲染。

## 核心能力

- 根据 `node.type` 从 registry 查找渲染实现。
- 处理节点 props/style 合并。
- 透传交互态（selected/hovered/drag-over）。
- 支持插槽式渲染扩展。

## 与 designer 的协作

- 接收 designer 传入的渲染上下文（事件、选择、拖拽态）。
- 在拖拽经过容器时触发高亮视觉状态。
- Drop 后通过 designer 调 core 命令完成落地。

## 关键扩展点

- `renderContainerShell(ctx)`：容器壳替换。
- `renderWidget(node, ctx)`：widget 自定义渲染。
- `renderDropIndicator(ctx)`：拖拽高亮/占位样式。

## 约束

- 不承担业务状态管理，仅消费 core 状态。
- 不直接修改 schema。
- 渲染必须幂等，避免副作用。
