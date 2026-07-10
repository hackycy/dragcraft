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
├── bindings/
│   └── field-binding.ts
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
    ├── DcCanvasControls.ts
    ├── DcPropertyPanel.ts
    └── DcRightSidebar.ts
```

## UI Shell 工作台结构

`DcDesigner` 由左侧 Dock、画布和右侧 Inspector 组成。根节点只占宿主给出的高度，不读取 `100vh`；历史操作与宿主扩展控件悬浮在画布内，不额外占用布局高度。

工作台通过 `ResizeObserver` 观察自身宽度。默认小于 `1100px` 时进入 compact 模式：左右栏退出布局流，并以互斥抽屉覆盖画布；宽屏模式下两栏可以独立折叠为 `44px` rail。状态保存在 `DesignerInstance.workspace`，不写入浏览器存储。

左右栏各自拥有 rail 和贴近画布边缘的折叠控制。撤销、重做固定在画布悬浮历史区；`toolbarRenderer` 只渲染宿主选择提供的设备、预览等画布控件。

### 左栏：多 Tab 面板

`DcLeftSidebar` 提供竖向 icon tab 容器，当前内置：

- `Materials`：物料区。
- `Structure`：结构树区。

物料 tab 使用 `DcMaterialPanel`，提供：

- widget 分组展示。
- 按 `type`、标题、描述、标签和关键词模糊搜索。
- HTML5 drag source，drag start 时设置 `engine.store.setDragTarget`。
- `DesignerWidgetMeta.material` 展示协议，用于声明物料卡片标题、图标、描述、缩略图、标签和搜索关键词。
- `materialItemRenderer` 扩展点，自定义单个物料项内容；外层盒子、尺寸约束和拖拽行为由 designer 统一控制。
- 物料项始终可拖拽，`WidgetMeta.creatable` 在画布 drag-over/drop 阶段统一裁决是否可创建。

当 `creatable` 返回禁止决策时，画布显示红色虚线框，并在框中展示禁止原因；如果没有提供原因，则展示默认提示。禁用提示层由 container shell 渲染，使用 device frame 时覆盖整个设备预览区域，提示文本位于 frame 中央。自定义物料卡片仍会收到 `draggable: true` 与 `disabled: false`，避免左栏和画布出现两套创建规则。

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
- 画布只持有一个横纵滚动视口，设备框和长内容不会扩大工作台或页面。
- 支持 `WidgetMeta.sortable` 位置锁定约束，只显示合法 drop indicator。
- 支持 `WidgetMeta.creatable` 禁止原因，拖入被拒绝时通过 `forbiddenOverlay` 展示原因。
- 提供当前画布专属的 `data-dc-canvas-interaction-layer`。renderer 的选区外框和节点工具栏只 Teleport 到所属画布，多设计器实例之间不会共享全局 portal。

### 右栏：配置区

`DcPropertyPanel` 集成 `FormGenerator`：

- 固定包含 `Global` 与 `Widget` 两个 Tab。
- Global 配置始终可见。
- Widget 配置随当前选中节点变化。
- 选中 widget 时自动切到 Widget Tab。
- `usePropertyBinding` 负责协调表单读写，字段绑定解析与命令翻译位于纯函数 helpers `bindings/field-binding.ts`。
- 属性变更通过 `engine.execute()` 分发 `UPDATE_PROPS` 或 `SET_GLOBAL_CONFIG` 命令提交。
- 节点切换时通过 `key` 强制重新挂载表单。

## Designer API

### createDesigner

```ts
import { createAntDesignVueFields } from '@dragcraft/fields-ant-design-vue'

const designer = createDesigner({
  engineOptions: { initialSchema, maxHistorySize: 50 },
  widgetMetas: getAllWidgetMetas(),
  componentMap: getDefaultComponentMap(),
  fieldComponentMap: createAntDesignVueFields(),
  globalConfigSchema: myGlobalFormSchema,
  workspace: {
    compactBreakpoint: 1100,
    keyboardShortcuts: true,
  },
  extensions: {
    materialPanelRenderer: CustomPanel,
    materialItemRenderer: ({ material }) =>
      h('div', { class: 'my-material-content' }, material.title),
    toolbarRenderer: (api) => [],
  },
  actionInterceptors: [
    createConfirmActionInterceptor({
      confirm: ({ invocation }) => appModal.confirm(`确认执行 ${invocation.label}?`),
    }),
  ],
  eventHooks: {
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

### Public API 分级

`@dragcraft/designer` 默认出口保留标准接入面：`createDesigner`、`DcDesigner`、`useDesigner`、核心 schema/command 类型、字段 schema 类型和常用 renderer 扩展类型。直接访问 `engine.store`、renderer 内部 composable 或 action registry 属于高级集成能力；业务侧应优先使用 `engine.state` 和 `engine.execute()`。

## Designer 扩展点

| 扩展点 | 说明 |
| --- | --- |
| `materialPanelRenderer` | 替换左侧 Materials tab 内容 |
| `propertyPanelRenderer` | 替换右栏配置区渲染 |
| `materialItemRenderer` | 自定义单个物料项内容渲染 |
| `rendererExtensions` | 透传给 renderer 的扩展点 |
| `toolbarRenderer` | 在画布悬浮扩展区渲染宿主自定义控件 |
| `leftRailRenderer` / `rightRailRenderer` | 向左右 Sidebar rail 追加事件、设置等宿主工具 |

`DesignerWidgetMeta.material` 是 designer 层的一等物料展示协议，不进入 core schema，也不影响画布渲染组件：

```ts
interface DesignerWidgetMeta extends RendererWidgetMeta {
  material?: {
    title?: string
    titleKey?: string
    icon?: string | Component
    description?: string
    descriptionKey?: string
    thumbnail?: string
    tags?: string[]
    keywords?: string[]
    metadata?: Record<string, unknown>
  }
}
```

`materialItemRenderer` 接收解析后的展示数据和交互状态。Designer 始终拥有外层物料项 shell，负责固定宽度、截断、overflow 防护和拖拽事件；业务渲染器只输出内部内容：

```ts
interface MaterialItemRenderProps {
  meta: DesignerWidgetMeta
  material: ResolvedMaterialItem
  draggable: boolean
  disabled: boolean
  dragging: boolean
}
```

物料栏属于高密度工具区，推荐常驻展示只包含图标、标题和短标签；描述、关键词和更多业务数据优先用于搜索、tooltip 或完整替换 `materialPanelRenderer` 后的详情交互，避免两列栏位出现横向滚动或信息噪声。

`toolbarRenderer` 接收 `ToolbarSlotAPI`：

| 属性 | 说明 |
| --- | --- |
| `undo` / `redo` | 历史操作 |
| `canUndo` / `canRedo` | 历史状态 |
| `execute` | 执行 core command |
| `engine` | 访问 engine 实例 |
| `workspace` | 打开、关闭左右栏并读取 wide/compact 模式 |
| `t` | 使用当前 designer i18n 文案 |

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
- 业务与命令外部读取 schema 时优先使用 `engine.state`；renderer 的响应式渲染可继续消费 store 侧的只读状态；写入必须执行 core command。
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

## ComponentMap 与 RendererWidgetMeta

Core 的 `CoreWidgetMeta` 不包含 Vue 组件引用。Renderer 通过 `ComponentMap` 解析 `node.type`，并在 `RendererWidgetMeta` 中承载 renderer 专属 UI 元数据（如 `wrapper` 与扩展 action）。Designer 在此之上用 `DesignerWidgetMeta.material` 承载物料栏展示元数据：

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
- `actionInterceptors`。
- `actionRegistry`。
- `dragOverNodeId`。
- `dragOverIndex`。

## Node Action 与 Action Runtime

节点工具栏由 `NodeActionRegistry` 管理。点击动作统一进入 Action Runtime，运行 `actionInterceptors` 后再执行 action 声明的 `command` 或 `handler`。

内置动作：

| Key | 排序 | 类型 | 说明 |
| --- | --- | --- | --- |
| `drag` | 100 | `drag-handle` | 拖拽排序 |
| `move-up` | 200 | `button` | 上移 |
| `move-down` | 300 | `button` | 下移 |
| `delete` | 400 | `button` | 删除，`risk: 'destructive'` |

复制等自定义 action 如果会新增节点，必须声明或执行 `ADD_NODE`，由 core 统一校验 `WidgetMeta.creatable` 和排序约束；action 的 `available` 可复用同一决策提前禁用按钮。

动作定义：

```ts
interface NodeActionDefinition {
  key: string
  label: string
  icon?: string | Component
  type: 'button' | 'drag-handle'
  order: number
  risk?: 'normal' | 'destructive'
  metadata?: Record<string, unknown>
  visible?: (ctx: NodeActionContext) => boolean
  available?: (ctx: NodeActionContext) => boolean
  disabled?: (ctx: NodeActionContext) => boolean
  command?: (ctx: NodeActionContext, e: MouseEvent) => Command | null | undefined
  handler?: (ctx: NodeActionContext, e: MouseEvent) => MaybePromise<void>
  className?: string
}
```

Action Runtime 拦截器：

```ts
interface ActionInterceptor {
  beforeAction?: (invocation: ActionInvocation) => MaybePromise<boolean | ActionDecision | void>
  afterAction?: (invocation: ActionInvocation) => MaybePromise<void>
  onActionError?: (invocation: ActionInvocation, error: unknown) => void
}
```

确认框、权限校验、埋点、审计、toast 等业务侧行为通过 `actionInterceptors` 注入。库不调用浏览器原生 `confirm`，只提供 `createConfirmActionInterceptor` 辅助业务把任意确认 UI 接入管线。

## Event Hooks

Renderer hooks 只处理非 action 的渲染交互事件。节点动作的取消、确认和副作用统一进入 Action Runtime。

```ts
interface RendererEventHooks {
  onBeforeSelect?: (payload: SelectHookPayload) => MaybePromise<boolean | void>
  onAfterSelect?: (payload: SelectHookPayload) => MaybePromise<void>
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

## 样式 DSL 预览解释

Renderer 只负责把 schema DSL 解释成设计器预览效果，不把 DSL 绑定到某个运行时平台。

当前解释规则：

| DSL | 预览位置 |
| --- | --- |
| `schema.root.style.surface` | 默认 container shell 或 device frame 内容 surface |
| `node.style.container` | `.dc-node` 外层节点盒子 |
| `node.style.content` | 实际 widget 组件 vnode 的 `style` |

示例：

```ts
{
  id: 'banner',
  type: 'banner',
  props: {},
  style: {
    container: { marginTop: -12 },
    content: { color: '#1677ff' },
  },
}
```

`container/content/surface` 内部是开放对象。Renderer 不枚举“背景色”“背景图”等业务字段，只按作用域把对象放到对应预览承载点。

## Widget Runtime

物料组件如果需要在自身交互中修改当前节点，可以使用 renderer 提供的注入式 runtime：

```ts
import { useWidgetRuntime } from '@dragcraft/renderer'

const runtime = useWidgetRuntime()
runtime.updateContainerStyle({ marginTop: -12 })
runtime.updateContentStyle({ color: '#1677ff' })
runtime.updateProps({ title: '新标题' })
```

Runtime 只暴露当前节点的受控更新方法，底层仍然执行 core command：

- `updateProps(patch)` -> `UPDATE_PROPS({ props })`
- `updateStyle(patch)` -> `UPDATE_PROPS({ style })`
- `updateContainerStyle(patch)` -> `UPDATE_PROPS({ style: { container } })`
- `updateContentStyle(patch)` -> `UPDATE_PROPS({ style: { content } })`

因此物料内部修改仍会进入历史记录、事件通知和 schema 导出链路。物料不应通过 runtime 直接修改 DOM 状态来模拟 schema 行为。

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

`useToolbarPosition` 使用 `@floating-ui/dom` 的 `autoUpdate` 跟踪节点工具栏坐标。工具条始终位于所属 frame 的左边缘，用户不需要根据空间猜测动作位置。

策略：

- `autoUpdate` 跟踪祖先滚动、尺寸变化和布局偏移，只在节点被选中时运行。
- 工具栏固定使用 `left-start`，横坐标由 `[data-dc-toolbar-boundary]` 的左边缘和工具栏真实宽度决定。
- 纵坐标跟随当前节点顶部，并按工具栏真实高度限制在画布 viewport 内。
- Widget 离开画布可见区域时隐藏 toolbar；Renderer 独立使用时退回浏览器 viewport。
- 工具栏与选区 Teleport 到所属画布 interaction layer，画布面板负责统一层级。

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
