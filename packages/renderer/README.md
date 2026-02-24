# @dragcraft/renderer

`@dragcraft/renderer` 负责将 core 的 schema 节点渲染为 Vue 组件树。

## 目标

- 将数据结构稳定映射为可视组件。
- 支持 mask 覆盖层与选中工具栏。
- 支持可替换渲染策略，不破坏 schema 协议。

## 设计边界

- 不承担业务状态管理，仅消费 core 状态。
- 不直接修改 schema（选中/删除/移动操作通过 `engine.execute()` 执行）。
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
│   ├── RootRenderer.ts             # 根入口，provide context，渲染扁平 widget 列表
│   ├── WidgetRenderer.ts           # Widget 渲染：解析组件 + mask + handle + 工具栏
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
}
```

由上层（designer）负责收集 ComponentMap 并传入 `RootRenderer`。

### 渲染管线

```
RootRenderer          → 根入口，provide context，渲染容器壳
  └─ WidgetRenderer[] → 扁平遍历 root.children，逐个渲染 widget
       ├─ 组件内容     → 从 componentMap 解析并渲染
       ├─ Mask 覆盖层  → mask=true 时的透明遮罩（点击选中）
       ├─ Handle 角标  → mask=false 时的 hover 选中按钮
       └─ 浮动工具栏   → 选中时显示（上移/下移/删除）
```

1. **RootRenderer**：接收 `engine`、`componentMap`、`extensions` 作为 props，创建 `RendererContext` 并通过 `provide` 注入子树。遍历 `root.children` 直接渲染 `WidgetRenderer`。
2. **WidgetRenderer**：渲染物料节点，从 `componentMap` 解析组件并传入 `node.props`。支持 mask 覆盖层、选中 handle 和浮动工具栏。

## 组件详解

### RootRenderer（根入口）

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `engine` | `DesignerEngine` | 是 | core 引擎实例 |
| `componentMap` | `ComponentMap` | 是 | node.type → Vue 组件映射 |
| `extensions` | `RendererExtensions` | 否 | 扩展点覆盖 |
| `dragOverNodeId` | `Ref<string \| null>` | 否 | 拖拽悬停状态（由 designer 管理） |

空画布时显示 `dc-container-shell--empty` + "拖拽组件到这里"占位。

### WidgetRenderer

- 从 `componentMap` 查找物料组件，未找到则渲染 `DefaultWidgetFallback`。
- `node.props` 通过展开运算符传递给解析到的组件。
- `node.style` 应用到外层 wrapper div 上。

**Mask 覆盖层**（`mask !== false`，默认）：
- 渲染 `dc-node__mask` 透明覆盖层，阻止 widget 交互。
- 点击覆盖层调用 `engine.store.selectNode()` 选中 widget。

**选中 Handle**（`mask === false`）：
- widget 可直接交互，不覆盖遮罩。
- hover 时右上角显示 `dc-node__handle` 角标按钮，点击选中 widget。

**浮动工具栏**（选中时）：
- 在 widget 右侧浮动显示 `dc-node__toolbar`。
- 三个按钮：上移（↑）、下移（↓）、删除（✕），均设置 `type="button"` 避免默认 submit 行为。
- 通过 `engine.execute()` 执行 `MOVE_NODE` / `REMOVE_NODE` 命令。
- 首个 widget 的上移和末尾 widget 的下移按钮禁用。

## Props/Style 策略

| 关注点 | 应用目标 | 机制 |
|--------|----------|------|
| `node.props` | 解析到的 Vue 组件 | `h(Component, { ...node.props })` |
| `node.style` | 外层 wrapper div | `:style="{ ...node.style }"` |
| 交互 class | 外层 wrapper div | `dc-node--selected/hovered/drag-over` |

## 交互状态

- **选中**：点击 mask 覆盖层或 handle 调用 `engine.store.selectNode(nodeId)`，`dc-node--selected` class。
- **悬停**：mouseenter/mouseleave 调用 `engine.store.hoverNode()`，`dc-node--hovered` class。
- **拖拽悬停**：由外部 `dragOverNodeId` ref 控制，`dc-node--drag-over` class + DropIndicator。

## 扩展点

| 扩展点 | 说明 | 默认实现 |
|--------|------|----------|
| `extensions.containerShell` | 替换根画布容器壳（手机壳、平板壳等） | `DefaultContainerShell`（plain div） |
| `extensions.dropIndicator` | 替换拖拽指示器 | `DefaultDropIndicator`（水平线） |
| `componentMap[type]` | 自定义 widget 渲染组件 | `DefaultWidgetFallback` |

## CSS Class 层级

```
.dc-root-renderer
  .dc-container-shell
    .dc-container-shell--empty          # 空画布
    .dc-node.dc-node--widget
      .dc-node--masked                  # mask=true
        .dc-node__mask                  # 透明覆盖层
      .dc-node--unmasked                # mask=false
        .dc-node__handle                # hover 角标
      .dc-node--selected
        .dc-node__toolbar               # 浮动工具栏
          .dc-node__toolbar-btn
          .dc-node__toolbar-btn--up
          .dc-node__toolbar-btn--down
          .dc-node__toolbar-btn--delete
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

- `@dragcraft/core`：消费 engine 的 store（schema、selectedNodeId、hoveredNodeId），调用 selectNode/hoverNode，执行 MOVE_NODE/REMOVE_NODE 命令。
- `@dragcraft/designer`：接收 designer 传入的 engine、componentMap、extensions、dragOverNodeId。
- `@dragcraft/widgets`：widgets 提供 Vue 组件，由 designer 收集到 componentMap 中。

## 约束

- 设置选中/悬停状态（`selectNode`/`hoverNode`）是安全的非 schema 修改操作。
- 工具栏操作（移动/删除）通过 core 命令系统执行。
- 渲染幂等，无副作用。

## 里程碑

1. ~~完成类型定义与上下文系统。~~ ✅
2. ~~完成组件渲染层（Root/Widget）。~~ ✅
3. ~~完成默认组件与交互状态。~~ ✅
4. ~~完成 mask 覆盖层、选中 handle、浮动工具栏。~~ ✅
5. 补齐单元测试。
