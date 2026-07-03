# Designer 与 Renderer

`@dragcraft/designer` 是标准业务接入的 UI Shell，`@dragcraft/renderer` 是 schema 到 Vue 组件树的渲染层。二者共同承担设计器交互，但 schema 写入始终回到 core command。

## Designer 定位

`@dragcraft/designer` 是对外入口包，负责：

- 统一导出组件、API 和类型。
- 创建并持有 core engine。
- 协调 renderer 与 form-generator。
- 接收业务传入的 widget meta、组件映射、字段组件映射和扩展点。
- 向业务屏蔽内部包组合细节。

技术栈：

- Vue 3 Composition API。
- render function 组件，不使用 SFC 模板。
- `@dragcraft/core` 是唯一状态与命令来源。

## Designer 文件结构

```plaintext
src/
├── index.ts
├── types.ts
├── context.ts
├── factory.ts
├── composables/
│   ├── useDesigner.ts
│   ├── useDragDrop.ts
│   └── usePropertyBinding.ts
└── components/
    ├── DcDesigner.ts
    ├── DcLeftSidebar.ts
    ├── DcMaterialPanel.ts
    ├── DcMaterialGroup.ts
    ├── DcMaterialItem.ts
    ├── DcStructurePanel.ts
    ├── DcCanvas.ts
    ├── DcPropertyPanel.ts
    └── DcToolbar.ts
```

## UI Shell 三栏结构

### 左栏：多 Tab 面板

`DcLeftSidebar` 提供竖向 icon tab 容器，当前内置：

- `Materials`：物料区。
- `Structure`：结构树区。

物料 tab 使用 `DcMaterialPanel`，提供：

- widget 分组展示。
- 按 `title` 和 `type` 模糊搜索。
- HTML5 drag source，drag start 时设置 `engine.store.setDragTarget`。
- `renderWidgetItem` 扩展点，自定义单个物料卡片。
- `WidgetMeta.creatable` 动态控制物料是否可拖入画布。

当 `creatable` 为 `false` 或谓词函数返回 `false` 时，物料卡片会带 `dc-material-item--disabled` class，`draggable` 设为 `false`，自定义渲染函数会收到 `disabled` prop。

结构树 tab 使用 `DcStructurePanel`，按当前扁平 schema 的 `root.children` 展示节点：

- 名称来自 `WidgetMeta.titleKey/title`，缺失时回退到 `node.type`。
- 同时展示节点 `id`。
- 点击节点调用选中 hooks 后选中对应画布节点。
- 删除按钮复用 renderer 的 node action registry，因此遵守 `deletable`、位置锁定约束和删除 hooks。

### 中栏：画布区

`DcCanvas` 集成 `RootRenderer`：

- 扁平模型下所有 widget 都添加到 `root.children`。
- 拖拽始终 drop 到 root，不做容器查找。
- 通过鼠标 Y 坐标与同一排序域内节点垂直中点比较，计算插入位置。
- `dragOverNodeId` 与 `dragOverIndex` 传给 renderer，驱动 DropIndicator。
- 新增 widget 后自动选中。
- 点击画布空白处取消选中。
- 支持 `toolbarRenderer` 扩展点，在画布顶部渲染自定义工具栏。
- 支持 `WidgetMeta.sortable` 位置锁定约束，只显示合法 drop indicator。
- 提供 `data-dc-designer-portal` 交互层出口，renderer 的选区外框和节点工具栏优先 Teleport 到该出口，避免直接散落到 `body` 与应用弹窗、面板层级竞争。

### 右栏：配置区

`DcPropertyPanel` 集成 `FormGenerator`：

- 固定包含 `Global` 与 `Widget` 两个 Tab。
- Global 配置始终可见。
- Widget 配置随当前选中节点变化。
- 选中 widget 时自动切到 Widget Tab。
- 属性变更通过 `UPDATE_PROPS` 或 `SET_GLOBAL_CONFIG` 命令提交。
- 节点切换时通过 `key` 强制重新挂载表单。

## Designer API

### createDesigner

```ts
const designer = createDesigner({
  engineOptions: { initialSchema, maxHistorySize: 50 },
  widgetMetas: getAllWidgetMetas(),
  componentMap: getDefaultComponentMap(),
  fieldComponentMap: buildDefaultFieldComponentMap(),
  globalConfigSchema: myGlobalFormSchema,
  extensions: {
    materialPanelRenderer: CustomPanel,
    toolbarRenderer: (api) => [],
  },
  eventHooks: {
    onBeforeDelete: ({ nodeId }) => confirm(`确认删除 ${nodeId}?`),
    onAfterSelect: ({ nodeId }) => console.log('选中:', nodeId),
  },
  customActions: [],
})
```

### useDesigner

```ts
const {
  schema,
  selectedNodeId,
  hoveredNodeId,
  execute,
  undo,
  redo,
  canUndo,
  canRedo,
  importSchema,
  exportSchema,
  on,
  off,
} = useDesigner(designer)
```

## Designer 扩展点

| 扩展点 | 说明 |
| --- | --- |
| `materialPanelRenderer` | 替换左侧 Materials tab 内容 |
| `propertyPanelRenderer` | 替换右栏配置区渲染 |
| `renderWidgetItem` | 自定义单个物料卡片渲染 |
| `rendererExtensions` | 透传给 renderer 的扩展点 |
| `toolbarRenderer` | 自定义画布内工具栏内容 |

`toolbarRenderer` 接收 `ToolbarSlotAPI`：

| 属性 | 说明 |
| --- | --- |
| `undo` / `redo` | 历史操作 |
| `canUndo` / `canRedo` | 历史状态 |
| `execute` | 执行 core command |
| `engine` | 访问 engine 实例 |

## Renderer 定位

`@dragcraft/renderer` 将 core schema 节点渲染为 Vue 组件树。

目标：

- 稳定映射数据结构到可视组件。
- 支持 mask、选中态、hover 态、drag-over 态和节点工具栏。
- 支持完整扩展点系统。
- 通过 composable 暴露核心交互逻辑。
- 通过 event hooks 拦截选中、删除、移动、拖拽等操作。
- 通过 node action 系统配置每个节点的工具栏按钮。

设计边界：

- 不承担业务状态管理。
- 不直接修改 schema。
- 选中和 hover 是 store 状态操作，移动、删除等 schema 写入必须执行 core command。
- 不内置 CSS 样式，只应用 class。

## Renderer 文件结构

```plaintext
src/
├── types.ts
├── context.ts
├── event-hooks.ts
├── action-registry.ts
├── composables/
│   ├── useNodeState.ts
│   ├── useWidgetNode.ts
│   ├── useNodeActions.ts
│   ├── useNodeDrag.ts
│   └── useToolbarPosition.ts
├── components/
│   ├── RootRenderer.ts
│   ├── WidgetRenderer.ts
│   ├── DefaultContainerShell.ts
│   ├── DefaultDropIndicator.ts
│   ├── DefaultWidgetFallback.ts
│   ├── DefaultNodeMask.ts
│   ├── DefaultNodeHandle.ts
│   ├── DefaultNodeToolbar.ts
│   └── DefaultEmptyState.ts
└── index.ts
```

## ComponentMap

Core 的 `WidgetMeta` 不包含 Vue 组件引用。Renderer 通过 `ComponentMap` 解析 `node.type`：

```ts
type ComponentMap = Record<string, Component>
```

由 designer 或业务方收集组件映射后传入 `RootRenderer`。

## Renderer 渲染管线

```plaintext
RootRenderer
  -> provide RendererContext
  -> render containerShell and emptyState
  -> WidgetRenderer[]
      -> useWidgetNode
      -> useNodeActions
      -> useNodeDrag
      -> resolve component from componentMap
      -> render nodeMask or nodeHandle
      -> render nodeToolbar
      -> apply nodeWrapper
```

节点选区外框和浮动工具栏使用 viewport 坐标，并通过 Teleport 逃出画布、设备框架和滚动容器的 overflow clipping。标准 Designer Shell 会提供专用 portal root；Renderer 单独使用时回退到 `body`。

`RootRenderer` 接收：

- `engine`。
- `componentMap`。
- `extensions`。
- `eventHooks`。
- `actionRegistry`。
- `dragOverNodeId`。
- `dragOverIndex`。

## Node Action 系统

节点工具栏由 `NodeActionRegistry` 管理。

内置动作：

| Key | 排序 | 类型 | 说明 |
| --- | --- | --- | --- |
| `drag` | 100 | `drag-handle` | 拖拽排序 |
| `move-up` | 200 | `button` | 上移 |
| `move-down` | 300 | `button` | 下移 |
| `delete` | 400 | `button` | 删除 |

动作定义：

```ts
interface NodeActionDefinition {
  key: string
  label: string
  icon?: string | Component
  type: 'button' | 'drag-handle'
  order: number
  visible?: (ctx: NodeActionContext) => boolean
  disabled?: (ctx: NodeActionContext) => boolean
  handler?: (ctx: NodeActionContext, e: MouseEvent) => void
  className?: string
}
```

## Event Hooks

Renderer hooks 支持同步和异步 before 操作，`onBefore*` 返回 `false` 可取消操作。

```ts
interface RendererEventHooks {
  onBeforeSelect?: (payload: SelectHookPayload) => MaybePromise<boolean | void>
  onAfterSelect?: (payload: SelectHookPayload) => MaybePromise<void>
  onBeforeDelete?: (payload: DeleteHookPayload) => MaybePromise<boolean | void>
  onAfterDelete?: (payload: DeleteHookPayload) => MaybePromise<void>
  onBeforeMove?: (payload: MoveHookPayload) => MaybePromise<boolean | void>
  onAfterMove?: (payload: MoveHookPayload) => MaybePromise<void>
  onBeforeDrag?: (payload: DragHookPayload) => boolean | void
  onAfterDrag?: (payload: DragHookPayload) => MaybePromise<void>
  onHoverChange?: (payload: HoverHookPayload) => void
}
```

约束：

- `onBeforeDrag` 必须同步，因为浏览器 DragEvent 的 `preventDefault()` 不能等待 Promise。
- `onHoverChange` 是高频通知事件，不支持取消。
- before hook 异常或 Promise 拒绝时取消操作。
- after hook fire-and-forget，异常只输出错误，不影响状态。
- 异步 before hook 执行期间，相同操作会被丢弃，避免并发状态不一致。

## Renderer 扩展点

| 扩展点 | 默认实现 | 说明 |
| --- | --- | --- |
| `containerShell` | `DefaultContainerShell` | 根画布容器壳 |
| `dropIndicator` | `DefaultDropIndicator` | 拖拽指示器 |
| `nodeWrapper` | 无 | 包裹每个节点 |
| `nodeToolbar` | `DefaultNodeToolbar` | 节点浮动工具栏 |
| `nodeMask` | `DefaultNodeMask` | 透明点击层 |
| `nodeHandle` | `DefaultNodeHandle` | hover 选中按钮 |
| `emptyState` | `DefaultEmptyState` | 空画布状态 |
| `widgetFallback` | `DefaultWidgetFallback` | 未知 widget fallback |

## 交互状态

- 选中：点击 mask 或 handle，调用 `engine.store.selectNode(nodeId)`，应用 `dc-node--selected`。
- 悬停：mouseenter/mouseleave 调用 `engine.store.hoverNode()`，应用 `dc-node--hovered`。
- 拖拽悬停：外部 `dragOverNodeId` 控制，应用 `dc-node--drag-over` 并渲染 DropIndicator。
- 不可选中：`WidgetMeta.selectable` 为 `false` 时忽略选中。
- 位置锁定：`WidgetMeta.sortable` 为 `false` 时应用 `dc-node--locked`，隐藏拖拽与移动动作。

## Toolbar 定位

`useToolbarPosition` 计算节点工具栏的视口固定坐标，解决工具栏被父级 overflow 裁剪的问题。

策略：

- 检测可滚动祖先容器，计算有效可见区域。
- 使用 `requestAnimationFrame` 在激活时跟踪滚动、缩放、拖拽重排、CSS 动画和过渡。
- Widget 不在有效可见区域时隐藏 toolbar。
- 超出右侧时翻转到左侧，超出上下边界时 clamp。
- 通过 `Teleport` 将 toolbar 渲染到 `body`，脱离 overflow 裁剪链。

## CSS Class 层级

```plaintext
.dc-root-renderer
  .dc-container-shell
    .dc-container-shell--empty
      .dc-empty-state
    .dc-node.dc-node--widget
      .dc-node--masked
        .dc-node__mask
      .dc-node--unmasked
        .dc-node__handle
      .dc-node--selected
        .dc-node__toolbar
      .dc-node--hovered
      .dc-node--locked
    .dc-drop-indicator
    .dc-widget-fallback
```

Renderer 不内置样式，class 由 `@dragcraft/themes` 或业务 CSS 实现视觉效果。
