---
description: "扩展节点动作、拦截器、设计器面板和渲染部件，并通过命令系统保持 Schema 写入一致。"
---

# 动作与视图扩展

`createDesigner()` 的 `customActions`、`actionInterceptors` 和 `extensions` 分别处理节点操作、操作前后的业务流程，以及 Designer 和画布的视觉部件。它们不修改 Schema 协议；需要写入页面时，动作仍应返回 Core command。

```ts
import { CommandType, createDesigner } from '@dragcraft/designer'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  customActions: [{
    key: 'copy-node',
    label: '复制',
    type: 'button',
    order: 350,
    command: ctx => ({
      type: CommandType.DUPLICATE_NODE,
      payload: { nodeId: ctx.node.id },
    }),
  }],
})
```

这会在选中节点的工具栏和结构树操作区加入“复制”。`command` 返回的命令由 `ctx.engine.execute()` 执行，因此创建约束、位置约束、历史记录和 schema 事件与内置操作一致。

## 添加或覆盖节点动作

每个 `customActions` 项都是 `NodeActionDefinition`。动作对所有节点注册；使用 `visible`、`available` 或 `disabled` 根据 `ctx.node`、`ctx.meta`、`ctx.schema`、`ctx.owner` 和兄弟节点位置收窄适用范围。

```ts
import { CommandType, createDesigner } from '@dragcraft/designer'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  customActions: [{
    key: 'mark-featured',
    label: '设为推荐',
    type: 'button',
    order: 500,
    visible: ctx => ctx.node.type === 'product-card',
    disabled: ctx => ctx.node.props.featured === true,
    command: ctx => ({
      type: CommandType.UPDATE_PROPS,
      payload: { nodeId: ctx.node.id, props: { featured: true } },
    }),
  }, {
    key: 'open-product',
    label: '查看商品',
    type: 'button',
    order: 510,
    visible: ctx => ctx.node.type === 'product-card',
    handler: ctx => window.open(`/products/${String(ctx.node.props.productId)}`, '_blank'),
  }],
})
```

`command` 适合 Schema 写入；`handler` 适合打开面板、跳转、埋点等副作用。一个动作可以同时声明两者：框架先执行 command，再调用 handler。异步 handler 执行期间，同一节点上的该动作会保持 pending，重复点击不会再次触发。

动作字段如下：

| 字段 | 用途 |
| --- | --- |
| `key` | 全局唯一标识。与内置 key 相同会直接替换该内置动作，不会合并字段。 |
| `label`、`icon`、`type`、`order` | 工具栏显示内容。`type` 为 `button` 或 `drag-handle`；内置动作的排序为 100、200、300、350、400。默认工具栏的 `drag-handle` 仅启动节点排序，不会调用该动作的 `command` 或 `handler`；需要执行自定义逻辑时使用 `button`。 |
| `visible(ctx)` | 返回 `false` 时完全不渲染。 |
| `available(ctx)`、`disabled(ctx)` | 任一条件使动作不可用时，动作保留在工具栏但禁用。 |
| `command(ctx, event)` | 返回 command、`null` 或 `undefined`。返回 command 时由 engine 执行。 |
| `handler(ctx, event)` | 处理不直接映射到 command 的同步或异步副作用。 |
| `risk`、`metadata` | 提供给 interceptor。`risk` 为 `normal` 或 `destructive`。 |
| `className` | 加到动作元素的 CSS class。 |

内置 key 为 `drag`、`move-up`、`move-down`、`duplicate` 和 `delete`。例如，用同一个 `key: 'duplicate'` 注册动作会覆盖默认的“复制”；原动作的 `available`、`disabled`、`command` 不会保留，所以覆盖时要自行实现所需约束。

物料也能通过 `meta.actions` 细化全局动作：`only` 只保留指定 key，`exclude` 排除指定 key，`extra` 只为该物料追加动作。全局规则适合产品级能力，物料规则适合某个组件类型的特例。

> [!IMPORTANT]
> `NodeActionContext` 中的 `node` 和 `schema` 是深只读快照。不要直接修改它们；返回 command 才会更新设计器状态。

## 在执行前确认、鉴权或记录

`actionInterceptors` 包裹所有已解析的节点动作，包括内置动作、`customActions` 和 `meta.actions.extra`。最常见的需求是为破坏性操作加确认框：

```ts
import { createConfirmActionInterceptor, createDesigner } from '@dragcraft/designer'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  actionInterceptors: [
    createConfirmActionInterceptor({
      confirm: ({ title, message }) => showConfirmDialog({ title, message }),
      title: '确认删除',
      message: invocation => `删除 ${invocation.ctx.node.type} 后可通过撤销恢复。`,
    }),
  ],
})
```

`createConfirmActionInterceptor()` 默认只拦截 `risk: 'destructive'` 的动作；默认 `delete` 已带有该风险级别。为自定义动作确认时，给动作设置 `risk: 'destructive'`，或通过 `shouldConfirm(invocation)` 指定自己的匹配条件。

需要多个策略时，按数组顺序运行：所有 `beforeAction` 允许后，框架执行 command 和 handler，随后按数组顺序调用 `afterAction`。任一 `beforeAction` 返回 `false` 或 `{ allowed: false }` 会取消本次操作；`reason` 只是返回给调用方的数据，默认工具栏不会自动显示它，因此宿主应自行提供提示。

```ts
const actionInterceptors = [{
  beforeAction: async invocation => {
    if (invocation.key !== 'publish')
      return

    return canPublish(invocation.ctx.schema)
      ? { allowed: true }
      : { allowed: false, reason: '缺少发布权限' }
  },
  afterAction: ({ key, ctx, command }) => {
    analytics.track('designer_action', {
      key,
      nodeId: ctx.node.id,
      commandType: command?.type,
    })
  },
  onActionError: (invocation, error) => {
    reportError(error, { action: invocation.key, nodeId: invocation.ctx.node.id })
  },
}]
```

`beforeAction` 可以同步或异步返回 `boolean`、`ActionDecision` 或不返回值。`afterAction` 在 command 已交给 engine、handler 已成功结束后调用；它不表示 command 一定修改了 Schema。需要根据 command result 显示成功或失败状态时，应在业务层直接执行命令并检查 `execute()` 的返回值。抛出的错误和 rejected Promise 会调用每个 interceptor 的 `onActionError`，并取消后续执行。

## 观察选择、拖拽和 hover

`eventHooks` 处理的是画布交互，不经过节点动作管线。需要在选中或排序前后同步业务状态时使用它；确认、异步权限和审计仍应使用 `actionInterceptors`。

```ts
const designer = createDesigner({
  widgetMetas,
  componentMap,
  eventHooks: {
    onBeforeSelect: ({ nodeId }) => canEditNode(nodeId),
    onAfterDrag: ({ nodeId }) => analytics.track('node_moved', { nodeId }),
    onHoverChange: ({ nodeId }) => previewStore.setHoveredNode(nodeId),
  },
})
```

`onBeforeSelect` 可同步或异步返回 `false` 来阻止选中，`onAfterSelect`、`onAfterDrag` 用于信息通知。`onBeforeDrag` 必须同步返回，因为浏览器需要在当前 `DragEvent` 内阻止拖拽；`onHoverChange` 也保持同步，避免高频 pointer 事件堆积。

## 替换 Designer 区域

`extensions` 用于定制 UI，不用于添加 Schema 行为。下面的卡片 renderer 会保留 Designer 管理的拖拽外壳、无障碍属性和拖拽状态，只替换物料项的内部内容：

```ts
import { h } from 'vue'

const designer = createDesigner({
  widgetMetas,
  componentMap,
  extensions: {
    materialItemRenderer: ({ material, dragging }) => h('div', {
      class: { 'app-material-card': true, 'app-material-card--dragging': dragging },
    }, [
      h('strong', material.title),
      material.description ? h('span', material.description) : null,
    ]),
  },
})
```

需要完整替换面板时传入 Vue 组件。它们挂载在 Designer 的注入上下文中，可以调用 `useDesignerContext()` 读取 engine、搜索词、当前 tab 和工作台状态；替换组件本身不接收业务 props。

| 字段 | 渲染位置与责任 |
| --- | --- |
| `materialPanelRenderer` | 替换左侧“物料”页内容。结构树 tab 仍由 Designer 渲染。自定义组件应自行实现物料搜索、分组和拖拽入口。 |
| `propertyPanelRenderer` | 替换右侧属性页内容。右侧全局/组件 tab 仍由 Designer 渲染。自定义组件应自行读取选中节点并提交字段变更。 |
| `materialItemRenderer(props)` | 只替换单个物料项的内容。`props` 包含 `meta`、解析后的 `material`、`draggable`、`disabled` 和 `dragging`；不要自行绑定拖拽事件。 |
| `leftRailRenderer(api)` | 追加到左侧 rail 内置 tab 之后。`api` 提供 `engine`、`workspace` 和翻译函数 `t`。 |
| `rightRailRenderer(api)` | 追加到右侧 rail 内置 tab 之后，API 与左侧相同。 |
| `rendererExtensions` | 继续传给 `@dragcraft/renderer`，用于画布和节点视觉，完整字段见下一节。 |

例如，把设置入口加到右侧 rail：

```ts
import { h } from 'vue'

extensions: {
  rightRailRenderer: ({ t }) => h('button', {
    type: 'button',
    title: t('settings.open', '打开设置'),
    onClick: openSettings,
  }, '设置'),
}
```

Rail 扩展会追加在内置 tab 后方，不会替换或控制左右栏的打开状态。需要切换面板时调用 `api.workspace.openLeft()`、`openRight()`、`toggleLeft()` 或 `toggleRight()`。

## 定制画布和节点视觉

`extensions.rendererExtensions` 的每个字段都是 Vue 组件。除 `containerShell` 外，未提供的字段都会继续使用内置实现；扩展只替换对应的视觉部件，不会绕过选中、拖拽、命令或放置校验。

```ts
import { defineComponent, h } from 'vue'

const EmptyState = defineComponent({
  props: { isDragOver: Boolean },
  setup: props => () => h('p', props.isDragOver ? '松开放置组件' : '从左侧拖入组件'),
})

const designer = createDesigner({
  widgetMetas,
  componentMap,
  extensions: {
    rendererExtensions: { emptyState: EmptyState },
  },
})
```

| 字段 | 组件收到的 props | 使用边界 |
| --- | --- | --- |
| `containerShell` | `isEmpty`、`regionVNodes`、`chromeVNodes`、`layerVNodes`、`forbiddenOverlayVNode`、`layoutPlan`、`surfaceStyle`、`registry`、`selectionPresentation`；default slot 与各 region 同名 slot | 替换根画布外壳，例如设备框架。必须渲染内容、chrome 和 layer VNode；需要自定义选中投影容器时，用 `selectionPresentation.registerPlane()` 注册 `root`、`content`、`viewport` 平面。 |
| `dropIndicator` | 无 | 替换拖入根区域或容器 region 时的插入指示。 |
| `nodeWrapper` | `nodeId`、`nodeType`、`owner`、`state`、`meta`；default slot | 包裹每个节点，适合附加标识或边框。必须渲染 default slot，否则物料内容会消失。单个物料的 `meta.wrapper` 优先于此全局 wrapper。 |
| `nodeToolbar` | `nodeId`、`nodeType`、`owner`、`actions`、`state`、`onDragStart`、`onDragEnd`、可选的 `toolbarPosition` | 替换节点悬浮工具栏。按钮应调用 `action.handler(event)`；`drag-handle` 应把传入拖拽回调绑到 `dragstart` 和 `dragend`。 |
| `nodeMask` | `nodeId`、`nodeType`、`owner`、`onSelect` | 替换 `mask: true` 节点的遮罩层。点击时调用 `onSelect`。 |
| `nodeHandle` | `nodeId`、`nodeType`、`owner`、`onSelect` | 替换 `mask: false` 节点的选择入口。点击时调用 `onSelect`。 |
| `nodeSelection` | `nodeId`、`nodeType`、`owner`、`projection` | 只替换选中轮廓的绘制。投影几何、坐标平面、Teleport 和 overflow 裁剪仍由 Renderer 管理。 |
| `emptyState` | `isDragOver` | 页面或 container region 为空时的占位内容。 |
| `forbiddenOverlay` | `widgetType`、`reason` | 当前拖入物料不能创建或不能放置时的提示层。`reason` 包含可选的 `code`、`messageKey` 与 `message`。 |
| `widgetFallback` | `nodeId`、`nodeType` | Schema 引用了未注册物料时的恢复态。不要在这里直接修改 Schema。 |

`containerShell` 的完整可工作示例见 [主题与设备框架](/guide/themes-and-device-frames)。它是唯一需要同时处理布局分区和选择平面的 Renderer 扩展；只改空态、遮罩、工具栏或选中样式时，优先替换对应的单一字段。

如果 shell 把 `forbiddenOverlayVNode` 放进自身布局，在组件对象上设置 `__dcHandlesForbiddenOverlay = true`。这个标记告诉 Renderer 不要在 shell 外再渲染同一层 fallback；不设置时，Renderer 会保留外部 fallback，以确保禁止放置状态仍可见。

## 选择扩展点

| 目标 | 使用的选项 |
| --- | --- |
| 增加、替换或限制节点工具栏动作 | `customActions`，以及物料的 `meta.actions` |
| 确认、权限检查、审计和错误上报 | `actionInterceptors` |
| 物料卡片或整个物料/属性面板 | `extensions.materialItemRenderer`、`materialPanelRenderer`、`propertyPanelRenderer` |
| 在左右栏增加宿主工具 | `extensions.leftRailRenderer`、`rightRailRenderer` |
| 设备框架、空态、工具栏、选择轮廓与节点包裹层 | `extensions.rendererExtensions` |
| 选择、拖动与 hover 的事件通知 | `eventHooks`；浏览器拖拽前置 hook 必须同步返回 |

`customActions` 和 `actionInterceptors` 在 `createDesigner()` 时注册。`extensions` 也应在创建实例时提供；Renderer 在挂载时保存这些对象，运行中替换扩展对象不会更新现有画布。需要切换一组 Renderer 扩展时，为承载 `DcDesigner` 的位置更换 key 并重新挂载。

公开类型可从 `@dragcraft/designer` 导入：`NodeActionDefinition`、`NodeActionContext`、`ActionInterceptor`、`DesignerExtensions`、`RendererExtensions` 及各 Renderer extension props 类型。需要定义物料的创建与交互规则时，继续阅读 [自定义物料](/guide/materials-and-fields)。
