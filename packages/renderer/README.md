# @dragcraft/renderer

`@dragcraft/renderer` 负责将 core 的 schema 节点渲染为 Vue 组件树。

## 目标

- 将数据结构稳定映射为可视组件。
- 支持容器与 widget 的分层渲染。
- 支持可替换渲染策略，不破坏 schema 协议。

## 设计边界

- 不承担业务状态管理，仅消费 core 状态。
- 不直接修改 schema（不调用 `engine.execute()`）。
- 渲染必须幂等，避免副作用。
- 不内置 CSS 样式，仅应用 CSS class 名。

## 快速上手

```ts
import { createEngine } from '@dragcraft/core'
import { RootRenderer } from '@dragcraft/renderer'

const engine = createEngine()

// 注册 widget 元信息
engine.registerWidget({
  type: 'button',
  title: '按钮',
  group: 'basic',
  defaultProps: { text: 'Click me' },
  formSchema: {},
})

// 准备组件映射
const componentMap = {
  button: ButtonWidget, // 你的 Vue 组件
}

// 在 Vue 模板中使用
// <RootRenderer :engine="engine" :component-map="componentMap" />
```

## 文件结构

```
src/
├── types.ts                        # 类型定义 + InjectionKey
├── context.ts                      # createRendererContext + useRendererContext
├── composables/
│   ├── useNodeState.ts             # 节点交互状态（selected/hovered/drag-over）
│   └── index.ts
├── components/
│   ├── RootRenderer.ts             # 根入口，provide context，渲染根容器子节点
│   ├── NodeRenderer.ts             # 分发：container → ContainerRenderer / widget → WidgetRenderer
│   ├── ContainerRenderer.ts        # 容器渲染，递归子节点，drop indicator
│   ├── WidgetRenderer.ts           # 物料渲染，解析组件，应用 props/style
│   ├── DefaultContainerShell.ts    # 默认画布容器壳（plain div）
│   ├── DefaultDropIndicator.ts     # 默认拖拽指示器
│   ├── DefaultWidgetFallback.ts    # 未找到组件时的 fallback
│   └── index.ts
└── index.ts                        # 公共 API barrel export
```

## 核心概念

### ComponentMap（组件映射）

core 的 `WidgetMeta` 不包含 Vue 组件引用（core 保持框架无关）。renderer 通过 `ComponentMap`（`Record<string, Component>`）解析 `node.type` 到实际 Vue 组件。

```ts
type ComponentMap = Record<string, Component>

// 示例
const componentMap = {
  button: ButtonWidget,
  text: TextWidget,
  'flex-row': FlexRowContainer,
}
```

由上层（designer）负责收集 ComponentMap 并传入 `RootRenderer`。

### 渲染分层

```
RootRenderer          → 根入口，provide context，渲染容器壳
  └─ NodeRenderer     → 按 nodeType 分发
       ├─ ContainerRenderer  → 容器节点，递归渲染 children
       └─ WidgetRenderer     → 物料节点，解析并渲染组件
```

1. **RootRenderer**：接收 `engine`、`componentMap`、`extensions` 作为 props，创建 `RendererContext` 并通过 `provide` 注入子树。
2. **NodeRenderer**：纯分发，按 `node.nodeType` 路由到 `ContainerRenderer` 或 `WidgetRenderer`。
3. **ContainerRenderer**：渲染容器节点，支持自定义容器布局组件，递归渲染 children。
4. **WidgetRenderer**：渲染物料节点，从 `componentMap` 解析组件并传入 `node.props`。

## 组件详解

### RootRenderer（根入口）

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `engine` | `DesignerEngine` | 是 | core 引擎实例 |
| `componentMap` | `ComponentMap` | 是 | node.type → Vue 组件映射 |
| `extensions` | `RendererExtensions` | 否 | 扩展点覆盖 |
| `dragOverNodeId` | `Ref<string \| null>` | 否 | 拖拽悬停节点 ID（由 designer 管理） |

### ContainerRenderer

- 从 `componentMap` 查找容器布局组件（可选），找到则用该组件包裹 children，否则直接渲染 children。
- `isDragOver` 时在末尾追加 `DropIndicator` 组件。
- 空容器应用 `dc-container--empty` CSS class。

### WidgetRenderer

- 从 `componentMap` 查找物料组件，未找到则渲染 `DefaultWidgetFallback`。
- `node.props` 通过展开运算符传递给解析到的组件。
- `node.style` 应用到外层 wrapper div 上。

## Props/Style 策略

| 关注点 | 应用目标 | 机制 |
|--------|----------|------|
| `node.props` | 解析到的 Vue 组件 | `h(Component, { ...node.props })` |
| `node.style` | 外层 wrapper div | `:style="{ ...node.style }"` |
| 交互 class | 外层 wrapper div | `dc-node--selected/hovered/drag-over` |

## 交互状态

- **选中**：点击节点调用 `engine.store.selectNode(nodeId)`，`dc-node--selected` class。
- **悬停**：mouseenter/mouseleave 调用 `engine.store.hoverNode()`，`dc-node--hovered` class。
- **拖拽悬停**：由外部 `dragOverNodeId` ref 控制，`dc-node--drag-over` class + DropIndicator。

## 扩展点

| 扩展点 | 说明 | 默认实现 |
|--------|------|----------|
| `extensions.containerShell` | 替换根画布容器壳（手机壳、平板壳等） | `DefaultContainerShell`（plain div） |
| `extensions.dropIndicator` | 替换拖拽指示器 | `DefaultDropIndicator`（水平线） |
| `componentMap[type]` | 容器/物料的自定义渲染组件 | 容器：直接渲染 children / 物料：DefaultWidgetFallback |

## CSS Class 层级

```
.dc-root-renderer
  .dc-container-shell
    .dc-node.dc-node--container
      .dc-node--selected
      .dc-node--hovered
      .dc-node--drag-over
      .dc-container--empty
    .dc-node.dc-node--widget
      .dc-node--selected
      .dc-node--hovered
    .dc-drop-indicator > .dc-drop-indicator__line
    .dc-widget-fallback
```

renderer 不内置样式，仅应用 class 名，由使用方或 designer 提供样式。

## Composables

### useRendererContext()

注入 `RendererContext`，必须在 `RootRenderer` 子树内使用。

### useNodeState(getNodeId, ctx)

为单个节点计算响应式交互状态：

```ts
interface NodeInteractionState {
  isSelected: ComputedRef<boolean>
  isHovered: ComputedRef<boolean>
  isDragOver: ComputedRef<boolean>
  interactionClasses: ComputedRef<Record<string, boolean>>
}
```

## 响应式策略

core 使用 `shallowRef` + `triggerRef` 对 schema 进行 in-place 修改。renderer 的每个组件：

1. 在 render 函数中读取 `engine.store.schema.value` 建立响应式依赖。
2. 传递 node props 时使用展开运算符 `{ ...node.props }` 创建新对象快照，确保 VNode diff 正确。

## 与其他包协作

- `@dragcraft/core`：消费 engine 的 store（schema、selectedNodeId、hoveredNodeId），调用 selectNode/hoverNode。
- `@dragcraft/designer`：接收 designer 传入的 engine、componentMap、extensions、dragOverNodeId。
- `@dragcraft/widgets`：widgets 提供 Vue 组件，由 designer 收集到 componentMap 中。

## 约束

- 所有写操作须通过 core 命令系统，renderer 不调用 `engine.execute()`。
- 设置选中/悬停状态（`selectNode`/`hoverNode`）是安全的非 schema 修改操作。
- 渲染幂等，无副作用。

## 里程碑

1. ~~完成类型定义与上下文系统。~~ ✅
2. ~~完成组件渲染层（Root/Node/Container/Widget）。~~ ✅
3. ~~完成默认组件与交互状态。~~ ✅
4. 补齐单元测试。
