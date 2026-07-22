# Designer 与 Renderer

`@dragcraft/designer` 是标准业务接入的 Vue 可视化搭建工作台，`@dragcraft/renderer` 是 schema 到 Vue 组件树的渲染层。二者共同承担设计器交互，但 schema 写入始终回到 core command。

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

## Vue 可视化搭建工作台结构

`DcDesigner` 由左侧 Dock、画布和右侧 Inspector 组成。根节点只占宿主给出的高度，不读取 `100vh`；历史、指针、抓手和重置位置控件悬浮在画布内，不额外占用布局高度。

工作台通过 `ResizeObserver` 观察自身宽度。默认小于 `1100px` 时进入 compact 模式：左右栏退出布局流，并以互斥抽屉覆盖画布；宽屏模式下两栏可以独立折叠为 `44px` rail。状态保存在 `DesignerInstance.workspace`，不写入浏览器存储。

左右栏各自拥有 rail 和贴近画布边缘的折叠控制。画布悬浮区是 Designer 内部交互面，只包含撤销、重做、指针、抓手和重置位置；设备、预览和发布等产品控件由宿主在 Designer 外部组织。

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

结构树 tab 使用 `DcStructurePanel`，展示 `root.children`，并把已解析容器展开为注册顺序的虚拟 region 与 region 普通子节点：

- 名称来自 `WidgetMeta.titleKey/title`，缺失时回退到 `node.type`。
- 同时展示节点 `id`。
- 点击节点调用选中 hooks 后选中对应画布节点。
- 删除按钮复用 renderer 的 node action registry，因此遵守 `deletable`、位置锁定约束和删除 hooks。
- region 行不是 schema 节点，不可选中；子节点动作使用其 container owner 与 region-local index。

### 中栏：画布区

`DcCanvas` 集成 `RootRenderer`：

- 容器节点只能添加到 `root.children`；普通 widget 可以添加到 root 或一个已解析 container region。
- root 拖放使用页面 sort scope，region 拖放使用 `ContainerRegionOutlet` 暴露的 destination。
- root 通过鼠标 Y 坐标与同一排序域内节点垂直中点比较；region 插入位置由外部物料的 `resolveDropIndex` 计算。
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

`@dragcraft/designer` 默认出口保留标准接入面：`createDesigner`、`DcDesigner`、`useDesigner`、核心 schema/command 类型、字段 schema 类型和常用 renderer 扩展类型。`engine.store` 只包含只读状态和 selection/hover/drag 交互方法；业务读取优先使用 `engine.state`，schema 写入使用 `engine.execute()`。

## Designer 扩展点

| 扩展点 | 说明 |
| --- | --- |
| `materialPanelRenderer` | 替换左侧 Materials tab 内容 |
| `propertyPanelRenderer` | 替换右栏配置区渲染 |
| `materialItemRenderer` | 自定义单个物料项内容渲染 |
| `rendererExtensions` | 透传给 renderer 的扩展点 |
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

画布由裁剪视口和可平移 stage 组成。stage 先以视口中心为数学原点，再根据 viewport 绝对位置、stage 尺寸和 `devicePixelRatio` 把最终左上角吸附到物理像素网格；恰好落在半物理像素时向 inline-start/block-start 取整，避免奇数尺寸 Frame 在 DPR=1 下产生模糊边线或单侧空隙。这个吸附量独立于用户 pan offset，并在 viewport/stage 尺寸、工作区布局或 DPR 变化时重新计算。stage 的最小工作宽度不等于设备 preset 宽度，较窄 Frame 必须通过 inline auto margin 在 stage 内居中。frame 大于视口时仍在相对两侧等量裁切，不通过滚动位置模拟居中。

抓手模式维护独立的二维平移量，因此不受内容尺寸和滚动边界限制。用户也可以在指针模式下按住空格临时抓取；重置位置会将平移量归零，设备 frame 被替换时同样回到中心。普通内容更新和尺寸变化不会覆盖用户已经拖动的位置。

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
  -> create one deeply-readonly schema snapshot per schema revision
  -> cache LayoutPlan, schema index, and action lock indices for that revision
  -> render containerShell and emptyState
  -> WidgetRenderer[]
      -> useWidgetNode
      -> useNodeActions
      -> useNodeDrag
      -> resolve component from componentMap
      -> render nodeMask, inline nodeHandle, or Frame-external container handle
      -> project selected node into shell plane
      -> render nodeSelection presenter
      -> render nodeToolbar
      -> apply nodeWrapper
```

容器节点仍只由 root 创建一次 `WidgetRenderer`。当 meta 声明 `container` 时，renderer 提供 `ContainerRuntime`；外部物料通过 `ContainerRegionOutlet` 为每个 region 渲染普通子节点，因此每个 schema 节点只从唯一 owner 路径渲染一次。

`RendererContext.schema` 是每个 schema revision 共享的一份深冻结快照。`RootRenderer`、`useWidgetNode`、`useNodeActions`、行为谓词与 container drag-over 不再按节点调用 `state.getSchema()`；layout plan、ownership index 和 action lock sets 也按 revision 生成一次，避免渲染与结构树退化为 O(N²) 的全表克隆或扫描。

selected 高亮和浮动工具栏使用不同的呈现通道。高亮生成 Renderer-owned `NodeSelectionProjection`，并 Teleport 到 container shell 注册的 `root`、`content` 或 `viewport` 平面；工具栏继续 Teleport 到 Designer 全局 interaction layer。投影同时保留物料真实 `materialBounds` 与最终视觉 `bounds`：root owner 使用 `root-segment` 和覆盖完整 container shell/Device Frame 的 `root` 平面，`bounds` 横向扩展到整段 Frame、纵向跟随物料，默认 presenter 的上下边位于物料外侧、左右边占用 Frame 边框带；container owner 使用 `material-bounds`，其 `bounds` 与 wrapper border box 相同，并继承所属根级物料的 `content` 或 `viewport` 平面。root flow 与 sticky/flow chrome 向容器子树传播 content plane，fixed chrome 与 layer 传播 viewport plane；placement plane 不决定 root owner 自身的投影平面。各平面的原生滚动和 overflow 负责裁剪，选中态不改变物料布局。

resolved 容器的 handle 同样进入当前画布的全局 interaction layer，但不进入 selected 呈现平面。它与 root-owned selected toolbar 共享 `left-start` 定位语义：横向位于 Frame 左侧，纵向与容器可见顶部对齐，并限制在画布 interaction boundary 内。handle 在未选中时常驻，以低透明度呈现，并在自身 hover 或 focus 时恢复完整视觉；selected 后立即退出并由同位置的 toolbar 接管。它不依赖或写入容器物料 hover 状态。普通 unmasked 物料继续使用 wrapper 内的 handle。

`RootRenderer` 接收：

- `engine`。
- `componentMap`。
- `extensions`。
- `eventHooks`。
- `actionInterceptors`。
- `actionRegistry`。
- `dragOverNodeId`。
- `dragOverIndex`。
- `activeDestination`、`forbiddenDestination` 与容器 drop 回调。

## Container Renderer Public API

`ContainerRegionOutlet` 负责读取区域节点、渲染空态/插入态/禁止态，以及把 DOM 信息交给物料提供的 `ResolveContainerDropIndex`。它不定义 flex、grid 或任意插入几何。外部容器物料负责 DOM/CSS，并通过 outlet prop 或 `RendererWidgetMeta.containerAdapter.resolveDropIndex` 注册 renderer drop adapter。

```ts
const runtime = useContainerRuntime()

h(ContainerRegionOutlet, {
  regionId: runtime.regionDefinitions.value[0].id,
  resolveDropIndex: ({ event, itemElements }) =>
    itemElements.findIndex(element => event.clientY < element.getBoundingClientRect().top),
})
```

`useContainerRuntime()` 公开当前 node ID、variant、region definitions、region nodes 和 `requestVariantChange()`。未解析容器使用恢复型 fallback 展示并保留原始区域数据，而不是丢弃子树。

Designer 将 root 与 container region 都建模为 `NodeDestination`，但保留各自的视觉索引解析。结构树显示 root 容器、虚拟 region 和普通子节点；属性面板把 `{ scope: 'container', path: 'variant' }` 字段转译为 `CHANGE_CONTAINER_VARIANT`，不会把 variant 重复写入 props。

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

`NodeActionContext.node` 与 `NodeActionContext.schema` 都是 `DeepReadonly` 快照。action 需要写 schema 时返回 `command` 或调用 `engine.execute()`，不能修改 context 对象。

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
| `node.style.container` | Renderer 拥有的节点外层盒子 |
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
| `nodeHandle` | `DefaultNodeHandle` | 带语义图标的选择按钮；resolved 容器由 Renderer 外置定位 |
| `nodeSelection` | `DefaultNodeSelection` | selected 投影视觉 presenter |
| `emptyState` | `DefaultEmptyState` | 空画布状态 |
| `widgetFallback` | `DefaultWidgetFallback` | 未知 widget fallback |

自定义 `containerShell` 接收预先解析的 `regionVNodes`、`chromeVNodes`、`layerVNodes`、`layoutPlan` 与 `surfaceStyle: StyleValueMap`。Shell 不读取 schema；`surfaceStyle` 可包含字符串、数字等样式值，只能应用到内容 surface，不能覆盖 scrollport、inset、stacking context 等结构层。content selection plane 必须位于 scrollport 内的完整内容布局中，随内容自然滚动；root/viewport plane 留在 Shell 根坐标系。

## 交互状态

- 选中：点击 mask 或 handle，调用 `engine.store.selectNode(nodeId)`，节点主题状态包含 `selected`；resolved container 的自身空白也可以选择容器。
- 悬停：普通物料中最深的 `[data-node-id]` 独占 hover，hover 不生成范围高亮；resolved 容器物料不发布 hover，其常驻外置 handle 只响应自身 hover 或 focus。
- 拖拽悬停：外部 `dragOverNodeId` 控制，节点主题状态包含 `drag-over` 并渲染 DropIndicator。
- 不可选中：`WidgetMeta.selectable` 为 `false` 时忽略选中。
- 位置锁定：`WidgetMeta.sortable` 为 `false` 时节点主题状态包含 `locked`，隐藏拖拽与移动动作。

## Toolbar 定位

`useToolbarPosition` 使用 `@floating-ui/dom` 的事件式 `autoUpdate` 跟踪节点工具栏坐标，并消费 `useNodeInteractionGeometry` 计算出的可见矩形；它不参与 selected 投影定位。

策略：

- `autoUpdate` 跟踪祖先滚动、尺寸变化和布局偏移，只在节点被选中时运行，不启用逐帧轮询。
- root-owned 工具栏使用纵向 `left-start`，横坐标由 `[data-dc-toolbar-boundary]` 的左边缘和工具栏真实宽度决定。
- container-owned 工具栏使用水平 `top-end`；上方空间不足时翻转为 `bottom-end`，并在画布 viewport 内 shift。
- container-owned 工具栏只锚定节点可见交集；节点完全不可见时保持逻辑选中并隐藏工具栏。selected 投影 DOM 仍存在，由 shell 平面自然裁剪。
- 工具栏动作始终来自同一个 `NodeActionRegistry`，owner 只改变排列和定位，不改变动作解析。
- Widget 离开画布可见区域时隐藏 toolbar；Renderer 独立使用时退回浏览器 viewport。
- 工具栏 Teleport 到画布全局 interaction layer；selected 投影 Teleport 到 shell-owned interaction presentation plane。

## 主题契约层级

```plaintext
[data-dc-component="root-renderer"]
  [data-dc-component="container-shell"]
    [data-dc-component="empty-state"]
    [data-dc-component="node"][data-dc-state~="root-owned"]
    [data-dc-component="node"][data-dc-state~="container-owned"]
      [data-dc-node-surface]
      [data-dc-component="node-handle"]
    [data-dc-component="drop-indicator"]
  [data-dc-component="node-handle-anchor"]
  [data-dc-component="node-toolbar"]
  [data-dc-component="node-selection"]
  [data-dc-component="widget-fallback"]
```

Renderer 通过 `@dragcraft/renderer/structure.css` 提供必要结构样式；完整工作台主题会自动聚合该入口。外部视觉配方只依赖公开的 component/part/state 与 token，Renderer 内部 class 不属于主题契约。

基线交互视觉有三项必须保持一致：drop indicator 使用强调色虚线与浅强调色底；node toolbar 的 drag handle 与原生 `button` action 使用同一强调色表面和反色前景；`material-bounds` selection 绘制完整连续实线边框。结构层可以用私有 class 预留透明边框几何，完整主题按导入顺序在其后通过公开 hook 声明颜色或完整 border。对应视觉声明由 Themes 的 interaction recipe 校验保护。
