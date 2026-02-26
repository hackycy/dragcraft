# @dragcraft/renderer

`@dragcraft/renderer` 负责将 core 的 schema 节点渲染为 Vue 组件树。

## 目标

- 将数据结构稳定映射为可视组件。
- 支持 mask 覆盖层与选中工具栏。
- 支持可替换渲染策略，不破坏 schema 协议。
- 提供完整的扩展点系统，任意子组件均可替换。
- 通过 composable 暴露核心交互逻辑，支持完全自定义节点渲染。
- 通过 event hooks 拦截选中、删除、移动、拖拽等操作。
- 通过 action 系统配置每个节点的工具栏按钮。

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
├── types.ts                        # 类型定义 + InjectionKey + Props 接口
├── context.ts                      # createRendererContext + useRendererContext
├── event-hooks.ts                  # RendererEventHooks 接口 + payload 类型
├── action-registry.ts              # NodeActionRegistry + 默认 actions
├── composables/
│   ├── useNodeState.ts             # 节点交互状态（selected/hovered/drag-over）
│   ├── useWidgetNode.ts            # 节点状态 + 选中/hover 事件 + event hooks
│   ├── useNodeActions.ts           # 按节点解析可用 actions
│   ├── useNodeDrag.ts              # 拖拽 handle 行为 + event hooks
│   └── index.ts
├── components/
│   ├── RootRenderer.ts             # 根入口，provide context，渲染扁平 widget 列表
│   ├── WidgetRenderer.ts           # Widget 渲染编排层（composable + 扩展组件委托）
│   ├── DefaultContainerShell.ts    # 默认画布容器壳（plain div）
│   ├── DefaultDropIndicator.ts     # 默认拖拽指示器
│   ├── DefaultWidgetFallback.ts    # 未找到组件时的 fallback
│   ├── DefaultNodeMask.ts          # 默认 mask 覆盖层
│   ├── DefaultNodeHandle.ts        # 默认选中 handle
│   ├── DefaultNodeToolbar.ts       # 默认节点浮动工具栏
│   ├── DefaultEmptyState.ts        # 默认空画布状态
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
RootRenderer          → 根入口，provide context，渲染容器壳 + emptyState
  └─ WidgetRenderer[] → 扁平遍历 root.children，逐个渲染 widget
       ├─ useWidgetNode   → 状态 + 选中/hover 事件
       ├─ useNodeActions  → 解析可用 actions
       ├─ useNodeDrag     → 拖拽 handle 行为
       ├─ 组件内容         → 从 componentMap 解析并渲染
       ├─ NodeMask        → mask=true 时的透明遮罩（可替换）
       ├─ NodeHandle      → mask=false 时的 hover 选中按钮（可替换）
       ├─ NodeToolbar     → 选中时显示，基于 action 系统（可替换）
       └─ NodeWrapper     → 可选外层包裹（全局或 per-widget）
```

1. **RootRenderer**：接收 `engine`、`componentMap`、`extensions`、`eventHooks`、`actionRegistry` 作为 props，创建 `RendererContext` 并通过 `provide` 注入子树。遍历 `root.children` 渲染 `WidgetRenderer`。空画布时使用 `emptyState` 扩展点渲染占位。
2. **WidgetRenderer**：编排层——调用 composable 获取逻辑，委托扩展组件渲染子部件。

## 组件详解

### RootRenderer（根入口）

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `engine` | `DesignerEngine` | 是 | core 引擎实例 |
| `componentMap` | `ComponentMap` | 是 | node.type → Vue 组件映射 |
| `extensions` | `RendererExtensions` | 否 | 扩展点覆盖 |
| `eventHooks` | `RendererEventHooks` | 否 | 事件拦截钩子 |
| `actionRegistry` | `NodeActionRegistry` | 否 | 节点动作注册表（默认提供 4 个内置动作） |
| `dragOverNodeId` | `Ref<string \| null>` | 否 | 拖拽悬停状态（由 designer 管理） |
| `dragOverIndex` | `Ref<number \| null>` | 否 | 拖拽插入位置索引 |

### WidgetRenderer

- 通过 `useWidgetNode` 获取节点状态、选中/hover 事件处理。
- 通过 `useNodeActions` 解析该节点可用的工具栏 actions。
- 通过 `useNodeDrag` 获取拖拽 handle 行为。
- 根据 `extensions` 解析 mask/handle/toolbar/fallback 子组件。
- 支持 `meta.wrapper` 或 `extensions.nodeWrapper` 外层包裹。

## Node Action 系统

工具栏按钮不再硬编码，改为通过 `NodeActionRegistry` 管理：

### 内置动作

| Key | 排序 | 类型 | 说明 |
|-----|------|------|------|
| `drag` | 100 | `drag-handle` | 拖拽排序 |
| `move-up` | 200 | `button` | 上移 |
| `move-down` | 300 | `button` | 下移 |
| `delete` | 400 | `button` | 删除 |

### 动作定义

```ts
interface NodeActionDefinition {
  key: string                                    // 唯一标识
  label: string                                  // 显示文本
  icon?: string | Component                      // 图标
  type: 'button' | 'drag-handle'                 // 渲染类型
  order: number                                  // 排序值
  visible?: (ctx: NodeActionContext) => boolean   // 是否显示
  disabled?: (ctx: NodeActionContext) => boolean  // 是否禁用
  handler?: (ctx: NodeActionContext, e: MouseEvent) => void
  className?: string                             // CSS 类名
}
```

### 注册表

```ts
import { createNodeActionRegistry, createDefaultActions } from '@dragcraft/renderer'

// 创建带默认 actions 的注册表
const registry = createNodeActionRegistry()

// 添加自定义 action
registry.register({
  key: 'duplicate',
  label: '复制',
  icon: '📋',
  type: 'button',
  order: 350,  // 在 move-down(300) 和 delete(400) 之间
  handler: (ctx) => {
    // 复制逻辑...
  },
})

// 移除内置 action
registry.unregister('move-up')
```

### Per-Widget 动作配置

通过 `WidgetMeta.actions` 字段覆盖：

```ts
engine.registerWidget({
  type: 'header',
  title: '页头',
  group: 'layout',
  defaultProps: {},
  formSchema: {},
  actions: {
    only: ['drag', 'delete'],       // 仅保留拖拽和删除
    // 或
    // exclude: ['move-up', 'move-down'],  // 排除上移下移
  },
})
```

## Event Hooks（事件拦截）

Event hooks 在 composable 层拦截操作。`onBefore*` hook 返回 `false` 可取消操作。

```ts
interface RendererEventHooks {
  // ── 选中 ──
  onBeforeSelect?: (payload: SelectHookPayload) => boolean | void
  onAfterSelect?: (payload: SelectHookPayload) => void
  // ── 删除 ──
  onBeforeDelete?: (payload: DeleteHookPayload) => boolean | void
  onAfterDelete?: (payload: DeleteHookPayload) => void
  // ── 移动 ──
  onBeforeMove?: (payload: MoveHookPayload) => boolean | void
  onAfterMove?: (payload: MoveHookPayload) => void
  // ── 拖拽 ──
  onBeforeDrag?: (payload: DragHookPayload) => boolean | void
  onAfterDrag?: (payload: DragHookPayload) => void
  // ── Hover ──
  onHoverChange?: (payload: HoverHookPayload) => void
}
```

使用示例——删除前弹出确认：

```ts
const eventHooks: RendererEventHooks = {
  onBeforeDelete: ({ nodeId }) => {
    return confirm(`确认删除节点 ${nodeId}？`)
  },
  onAfterDelete: ({ nodeId }) => {
    console.log(`节点 ${nodeId} 已删除`)
  },
}
```

## 扩展点

renderer 提供 8 个扩展点，均可通过 `extensions` 替换默认实现：

| 扩展点 | 说明 | 默认实现 | Props 接口 |
|--------|------|----------|------------|
| `containerShell` | 根画布容器壳 | `DefaultContainerShell`（plain div） | — |
| `dropIndicator` | 拖拽指示器 | `DefaultDropIndicator`（水平线） | — |
| `nodeWrapper` | 包裹每个节点 | 无（直接渲染） | `NodeWrapperProps` |
| `nodeToolbar` | 节点浮动工具栏 | `DefaultNodeToolbar`（action 驱动） | `NodeToolbarProps` |
| `nodeMask` | mask 覆盖层 | `DefaultNodeMask`（透明点击层） | `NodeMaskProps` |
| `nodeHandle` | 选中 handle | `DefaultNodeHandle`（hover 角标） | `NodeHandleProps` |
| `emptyState` | 空画布状态 | `DefaultEmptyState`（图标+文字） | `EmptyStateProps` |
| `widgetFallback` | 未知 widget fallback | `DefaultWidgetFallback`（错误提示） | `WidgetFallbackProps` |

### Props 接口示例

```ts
interface NodeToolbarProps {
  nodeId: string
  nodeType: string
  actions: ResolvedNodeAction[]
  state: NodeInteractionState
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
}

interface NodeMaskProps {
  nodeId: string
  nodeType: string
  onSelect: (e: MouseEvent) => void
}

interface EmptyStateProps {
  isDragOver: boolean
}
```

## Props/Style 策略

| 关注点 | 应用目标 | 机制 |
|--------|----------|------|
| `node.props` | 解析到的 Vue 组件 | `h(Component, { ...node.props })` |
| `node.style` | 外层 wrapper div | `:style="{ ...node.style }"` |
| 交互 class | 外层 wrapper div | `dc-node--selected/hovered/drag-over` |

## 交互状态

- **选中**：点击 mask 覆盖层或 handle 调用 `engine.store.selectNode(nodeId)`，`dc-node--selected` class。支持 `onBeforeSelect` hook 拦截。
- **悬停**：mouseenter/mouseleave 调用 `engine.store.hoverNode()`，`dc-node--hovered` class。支持 `onHoverChange` hook 通知。
- **拖拽悬停**：由外部 `dragOverNodeId` ref 控制，`dc-node--drag-over` class + DropIndicator。
- **不可选中**：`WidgetMeta.selectable === false` 时忽略选中事件。

## CSS Class 层级

```
.dc-root-renderer
  .dc-container-shell
    .dc-container-shell--empty          # 空画布
      .dc-empty-state                   # 空状态组件
        .dc-empty-state__icon
        .dc-empty-state__text
    .dc-node.dc-node--widget
      .dc-node--masked                  # mask=true
        .dc-node__mask                  # 透明覆盖层（可替换）
      .dc-node--unmasked                # mask=false
        .dc-node__handle                # hover 角标（可替换）
      .dc-node--selected
        .dc-node__toolbar               # 浮动工具栏（可替换）
          .dc-node__toolbar-btn
          .dc-node__toolbar-btn--drag
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

### useWidgetNode(getNode, ctx)

从 WidgetRenderer 提取的完整节点交互逻辑：

```ts
interface UseWidgetNodeReturn {
  state: NodeInteractionState          // 响应式交互状态
  resolvedComponent: ComputedRef       // 解析到的 Vue 组件
  meta: ComputedRef                    // widget meta
  useMask: ComputedRef<boolean>        // 是否使用 mask
  selectable: ComputedRef<boolean>     // 是否可选中
  draggable: ComputedRef<boolean>      // 是否可拖拽
  wrapperClasses: ComputedRef          // 外层 CSS class
  handleSelect: (e: MouseEvent) => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
}
```

内部集成 `onBeforeSelect`、`onAfterSelect`、`onHoverChange` event hooks。

### useNodeActions(getNode, ctx)

解析节点可用 actions：

```ts
interface UseNodeActionsReturn {
  actions: ComputedRef<ResolvedNodeAction[]>
  actionContext: ComputedRef<NodeActionContext>
}
```

### useNodeDrag(getNode, ctx)

拖拽 handle 行为：

```ts
interface UseNodeDragReturn {
  handleDragStart: (e: DragEvent) => void
  handleDragEnd: (e: DragEvent) => void
}
```

内部集成 `onBeforeDrag`、`onAfterDrag` event hooks。

**自定义节点渲染时可直接使用这些 composable 获得核心逻辑：**

```ts
import { useWidgetNode, useNodeActions, useNodeDrag } from '@dragcraft/renderer'

// 在自定义 WidgetRenderer 的 setup 中
const { state, handleSelect, handleMouseEnter, handleMouseLeave } = useWidgetNode(getNode, ctx)
const { actions } = useNodeActions(getNode, ctx)
const { handleDragStart, handleDragEnd } = useNodeDrag(getNode, ctx)
```

## 响应式策略

core 使用 `shallowRef` + `triggerRef` 对 schema 进行 in-place 修改。renderer 的每个组件：

1. 在 render 函数中读取 `engine.store.schema.value` 建立响应式依赖。
2. 传递 node props 时使用展开运算符 `{ ...node.props }` 创建新对象快照，确保 VNode diff 正确。

## 与其他包协作

- `@dragcraft/core`：消费 engine 的 store（schema、selectedNodeId、hoveredNodeId），调用 selectNode/hoverNode，执行 MOVE_NODE/REMOVE_NODE 命令。
- `@dragcraft/designer`：接收 designer 传入的 engine、componentMap、extensions、eventHooks、actionRegistry、dragOverNodeId。
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
5. ~~完成 action 系统、event hooks、composable 提取。~~ ✅
6. ~~完成扩展点系统（8 个扩展点）。~~ ✅
7. 补齐单元测试。

## 无头设计（Headless Design）

本包采用无头组件模式：所有组件仅输出语义化 BEM CSS 类名（`dc-*`），不捆绑任何 CSS 样式文件。

视觉样式由独立的 `@dragcraft/themes` 包提供，支持以下使用模式：

- **开箱即用**：`import '@dragcraft/themes/antd'` 或 `import '@dragcraft/themes/material'`
- **无头模式**：不导入皮肤，自行编写全部 CSS
- **自定义换肤**：导入皮肤后覆盖 CSS 变量
