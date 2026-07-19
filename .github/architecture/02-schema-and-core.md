# Schema 与 Core Engine

`@dragcraft/core` 是 dragcraft 的领域内核，提供与 UI 无关的状态、命令、历史、注册、事件和布局投影能力。

## 设计边界

- 不包含 DOM 或 UI 代码。
- 不关心视觉渲染与样式。
- 不直接依赖具体 widget 组件，只依赖协议。
- 使用 Vue 的响应式 API 与上层包共享同一 reactivity 实例。
- 所有 schema 写操作统一进入 `CommandBus`。

## Schema 模型

Schema 使用 root 页面列表加一层容器区域所有权。`root.children` 包含页面节点；容器区域拥有自己的普通子节点，当前协议拒绝容器嵌套：

```ts
interface SchemaNode {
  id: string
  type: string
  props: Record<string, unknown>
  style?: NodeStyle
  container?: {
    variant: string
    regions: Record<string, SchemaNode[]>
  }
  layout?: {
    placement?:
      | { kind: 'flow', region?: string, sortScope?: string | false }
      | {
          kind: 'chrome'
          edge: 'block-start' | 'block-end' | 'inline-start' | 'inline-end'
          position?: 'fixed' | 'sticky' | 'flow'
          reserve?: { mode?: 'measure' | 'size' | 'none', size?: string | number }
          avoidContent?: boolean
        }
      | {
          kind: 'layer'
          layer?: string
          mode?: 'framework' | 'self'
          anchor?: { block?: 'start' | 'center' | 'end', inline?: 'start' | 'center' | 'end' }
        }
    order?: number
    visible?: boolean | ((ctx: { node: SchemaNode, schema: DesignerSchema }) => boolean)
  }
  children?: SchemaNode[]
}

interface DesignerSchema {
  version: string
  globalConfig: Record<string, unknown>
  root: SchemaNode
}

interface NodeStyle {
  container?: Record<string, unknown>
  content?: Record<string, unknown>
  surface?: Record<string, unknown>
}
```

核心规则：

- `root.children` 包含页面节点，是 `flow/chrome/layer` placement 的唯一入口。
- 容器节点必须直接属于 root；其 `container.regions` 拥有普通子节点，区域子节点不再声明页面 placement。
- `root` 是页面承载节点，`root.style.surface` 描述页面 surface 的开放样式 DSL。
- 不存在 `nodeType`，不区分容器和 widget。
- `children` 仅 root 保留；普通子节点只存在于一个容器 region 中，容器嵌套在当前协议中被拒绝。
- `style.container` 描述节点外层布局盒子，`style.content` 描述 widget 内容样式，`style.surface` 描述该节点拥有的承载面样式。
- `layout.placement` 声明节点进入内容流、固定 chrome 还是浮层。
- `flow/chrome/layer` 保持 root-only，不递归投影容器区域。
- `flow.sortScope` 是开放排序域，`false` 表示节点不参与画布拖拽排序。

## 样式 DSL

Schema 的样式字段只表达跨端 DSL，不绑定 Web、小程序、RN 或任意具体运行时。设计器预览层可以把这些样式解释为 DOM inline style，其他消费端可以映射到自己的样式系统。

样式按作用域显式拆分：

| 字段 | 语义 | 典型使用 |
| --- | --- | --- |
| `style.container` | 节点在当前 surface 中的外层布局盒子 | `marginTop: -12`、`padding`、`width` |
| `style.content` | 传给 widget 组件内容的样式 | `color`、`fontSize` |
| `style.surface` | 页面或容器节点拥有的承载面样式 | `backgroundColor`、`backgroundImage` |

示例：

```ts
const schema: DesignerSchema = {
  version: '1.0.0',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    style: {
      surface: {
        backgroundColor: '#f7f7f7',
        backgroundImage: 'url(https://example.com/bg.png)',
      },
    },
    children: [{
      id: 'hero',
      type: 'banner',
      props: {},
      style: {
        container: { marginTop: -12 },
      },
    }],
  },
}
```

`globalConfig` 保持业务开放配置，不作为页面背景、间距等可视 DSL 的固定入口。需要由全局表单编辑页面视觉时，应通过表单字段绑定写入 `root.style.surface.*`。

## LayoutPlan 投影

Core 基于 `root.children` 和物料默认布局生成 `LayoutPlan`：

- `entries`：所有布局节点，保证每个节点只渲染一次。
- `regions`：按 `flow.region` 分组，供 renderer 渲染内容区域。
- `chrome`：固定或结构 chrome 节点，例如顶部导航栏、底部标签栏。
- `layers`：浮层节点，例如 FAB、气泡、助手。
- `sortScopes`：按 `flow.sortScope` 分组，供拖拽、上移、下移等排序命令使用。
- `insets`：由 chrome 节点贡献的内容避让信息，供设备框架写入 CSS variables。

默认规则：

- 未声明 layout 的节点进入 `content` region，并参与 `content` sort scope。
- 非 `content` flow region 默认不参与排序，除非显式声明自己的 `sortScope`。
- `chrome` 和 `layer` 默认退出拖拽排序。
- `WidgetMeta.defaultLayout` 为物料提供默认布局，节点实例上的 `layout` 可覆盖它。
- `chrome.reserve` 声明内容区如何避让固定 chrome，支持测量尺寸或显式尺寸。
- `layer.mode: 'self'` 允许物料在框架提供的 layer 坐标系中自行定位。
- `visible` 支持静态布尔值或运行时谓词，不可见节点在设计模式下显示为半透明轮廓。

详细的布局机制参见 [布局系统](./08-layout-system.md)。

Renderer 负责把 root `LayoutPlan` 分发为 `regionVNodes`、`chromeVNodes` 和 `layerVNodes` 交给 `containerShell`。容器内部由 `createContainerPlan()` 单独投影。Shell 不重新读取 schema，不创建业务 widget vnode，只执行 content scrollport、chrome layer、floating layer 和 inset 写入。

## Container Schema 与 Core Public API

框架 schema 不保存 flex/grid 几何，schema version 也保持不变。外部容器 meta 通过 `ContainerDefinition` 注册变体、区域、静态约束、动态 `canPlace` 和物料自有的 `migrateVariant`。Core 在注册、导入和每条结构命令中重新校验这些声明。

主要公开入口：

- `validateContainerDefinition()`、`createContainerState()`、`createContainerPlan()`。
- `resolvePlacementDecision()`、`buildSchemaIndex()`、`validateSchema()`。
- `NodeDestination` 显式区分 root 与 `{ kind: 'container', containerId, regionId }`。
- `CHANGE_CONTAINER_VARIANT` 是修改 `container.variant` 的唯一命令入口。

结构命令返回 `CommandExecutionResult`。拒绝结果包含稳定 `code`，命令 draft 会被丢弃，不会触及已提交快照、history 或成功事件。跨 owner 的 add/move/remove/duplicate 与 undo 都以一个命令边界提交；未解析容器保留完整区域数据，只禁止结构修改。

## Core 文件结构

```plaintext
src/
├── types.ts
├── constants.ts
├── helpers.ts
├── layout.ts
├── sortable.ts
├── style.ts
├── schema-store.ts
├── event-hub.ts
├── registry.ts
├── history-manager.ts
├── command-bus.ts
├── engine.ts
├── commands/
│   ├── add-node.ts
│   ├── change-container-variant.ts
│   ├── duplicate-node.ts
│   ├── move-node.ts
│   ├── remove-node.ts
│   ├── update-props.ts
│   └── set-global-config.ts
└── index.ts
```

## 核心模块

### SchemaStore

`SchemaStore` 是 Core 内部可写模块，基于 `shallowRef` 和 `ref` 管理响应式状态。Schema 以递归冻结的已提交快照保存，`SchemaStoreInstance` 与 `createSchemaStore()` 不从包根导出。

主要能力：

- `schema`：响应式的深冻结 schema 快照引用。
- `selectedNodeId`：当前选中节点。
- `hoveredNodeId`：当前 hover 节点。
- `dragTarget`：拖拽目标信息。
- `getSchema()`：返回 schema 深拷贝，仅用于创建可编辑导出值。
- `getSnapshot()`：返回当前已提交的冻结快照，引用在下次提交前稳定。
- `setSchema(schema)`：导入时深拷贝并冻结，再替换整个 schema。
- `commitSchema(draft)`：冻结命令 draft 并原子提交。
- `restoreSnapshot(snapshot)`：undo/redo 和事务回滚时直接恢复已拥有的冻结快照。
- `selectNode(id | null)`、`hoverNode(id | null)`、`setDragTarget(target | null)`。
- `getNodeById(id)`：通过 schema index 查找 root 或容器区域中的节点。

### EngineStore

`engine.store` 是公开的运行时交互 facade，不是内部 `SchemaStore`：

- `schema`、`selectedNodeId`、`hoveredNodeId` 和 `dragTarget` 都是运行时只读 refs；schema 与 drag target 的嵌套字段同样不可写。
- 只提供 `selectNode()`、`hoverNode()` 和 `setDragTarget()` 三个非 schema 交互方法。
- 不暴露 `setSchema()`、`commitSchema()` 或任何 transient patch。所有 schema 写入仍必须进入 `engine.execute()`。

### EngineState

`engine.state` 是公开读取 facade：

- `getSchema()`：返回当前已提交的深冻结快照；类型为 `DeepReadonly<DesignerSchema>`，下一次有效变更前引用稳定。
- `getNodeById(id)`：通过随快照缓存的 schema index 返回冻结节点引用。
- `getSelectedNodeId()`、`getHoveredNodeId()`、`getDragTarget()`：返回运行时交互状态快照。

UI 层读取 schema 时优先使用 `engine.state`。需要可编辑或可传输的数据时使用 `engine.exportSchema()` 创建深拷贝。

### CommandBus

`CommandBus` 是所有写操作入口。

内置命令：

- `ADD_NODE`：添加 widget 到目标排序域，`index` 表示插入点。
- `MOVE_NODE`：在节点所属 `sortScope` 中重排序。
- `REMOVE_NODE`：删除节点。
- `DUPLICATE_NODE`：深复制普通节点或完整容器子树并重建 ID。
- `CHANGE_CONTAINER_VARIANT`：调用物料迁移器并原子替换完整容器状态。
- `UPDATE_PROPS`：更新节点 props/style，嵌套对象按路径递归合并。
- `SET_GLOBAL_CONFIG`：更新全局配置，嵌套对象按路径递归合并。

命令执行流程：

```plaintext
engine.execute({ type, payload })
  -> CommandBus
  -> capture frozen command-start snapshot
  -> clone one command-owned mutable draft
  -> handler(ctx, payload) reads ctx.schema and mutates ctx.draft
  -> reject or changed:false: discard draft without history/events
  -> changed:true: freeze and commit draft
  -> retain prior snapshot reference in history
  -> emit command event and schema:changed
```

`CommandExecutionResult` 的成功分支始终包含 `changed: boolean`。相同值的 props/global config 更新和同位置移动返回 `changed: false`，因此不会增加 revision、history 或变更事件。传给用户 predicate 的 `ctx.schema` 是命令开始时的冻结快照；即使回调泄漏这个引用，也无法越过命令边界修改状态。

### HistoryManager

历史管理基于已拥有的冻结快照引用，支持 undo、redo 和事务批处理；普通命令不再为 history 重复深拷贝整棵 schema。

主要能力：

- 响应式只读 `state`，包含 `canUndo`、`canRedo`、`undoCount` 和 `redoCount`。
- `undo()`、`redo()`。
- `canUndo()`、`canRedo()`。
- `beginTransaction(label?)`、`commitTransaction()`、`discardTransaction()`。
- `isInTransaction()`、`clear()`。

undo/redo 直接交换快照引用，不经过 `CommandBus`，避免历史回放再次写入历史。事务只有在已提交快照引用实际变化时才生成一条历史记录。

### Style normalization

`normalizeStyleValueMap()` 是 Core 的跨运行时样式 DSL helper。它只为已声明的长度属性把非零数字转换为 `px`，并由 renderer 与 device-frames 共同消费，避免不同 UI 包各自维护不一致的规则。

### Registry

注册中心管理物料和全局配置 schema：

- `registerWidget(meta)`。
- `registerGlobalConfigSchema(schema)`。
- `getWidget(type)`。
- `getGlobalConfigSchema()`。
- `getAllWidgets()`。

### EventHub

事件总线封装 `@dragcraft/utils` 的 `EventEmitter`。

内置事件：

| 事件名 | 触发时机 |
| --- | --- |
| `schema:changed` | schema 变更后 |
| `selection:changed` | 选中节点变化 |
| `history:changed` | 历史栈变化 |
| `node:added` | `ADD_NODE` 后 |
| `node:removed` | `REMOVE_NODE` 后 |
| `node:moved` | `MOVE_NODE` 后 |
| `node:updated` | `UPDATE_PROPS` 后 |
| `global-config:changed` | `SET_GLOBAL_CONFIG` 后 |
| `drag:enter` / `drag:over` / `drag:leave` / `drag:drop` | 拖拽生命周期 |

## Engine 主入口

`createEngine(options?)` 组装所有子系统：

Core engine 始终从默认空 schema 启动，`EngineOptions` 只包含运行参数。加载已有页面时先注册 widget metadata 与容器定义，再调用 `importSchema()`，使初始数据经过与后续导入相同的结构和注册表校验。Designer 的 `engineOptions.initialSchema` 是上层便捷入口，由 `createDesigner()` 按这个顺序完成注册和导入。

```ts
interface DesignerEngine {
  store: EngineStore
  state: EngineState
  commandBus: CommandBusInstance
  history: HistoryManagerInstance
  registry: RegistryInstance
  eventHub: EventHub

  execute(command): void
  registerHandler(type, handler): void
  registerWidget(meta): void
  exportSchema(): DesignerSchema
  importSchema(schema): void
  dispose(): void
}
```

## Widget 行为控制

`CoreWidgetMeta` 描述物料注册信息与 core 可见的画布行为协议：

```ts
interface CoreWidgetMeta {
  type: string
  title: string
  titleKey?: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  defaultStyle?: NodeStyle
  formSchema: FormSchemaShape
  container?: ContainerDefinition

  mask?: BehaviorPredicate<InstanceBehaviorContext>
  selectable?: BehaviorPredicate<InstanceBehaviorContext>
  draggable?: BehaviorPredicate<InstanceBehaviorContext>
  sortable?: BehaviorPredicate<InstanceBehaviorContext>
  deletable?: BehaviorPredicate<InstanceBehaviorContext>
  defaultLayout?: NodeLayout

  creatable?: CreatableBehaviorPredicate
  actions?: CoreWidgetActionConfig
}
```

Vue 组件引用、`wrapper`、renderer 侧 action extra 配置和物料栏展示数据不属于 core 协议；这些 UI 元数据由 renderer 的 `RendererWidgetMeta` 与 designer 的 `DesignerWidgetMeta.material` 扩展承载。

行为字段支持静态布尔值或运行时谓词函数：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `mask` | `true` | 为 `false` 时不渲染透明遮罩，允许直接交互 |
| `selectable` | `true` | 为 `false` 时节点无法点击选中 |
| `draggable` | `true` | 为 `false` 时隐藏拖拽 handle 和上移/下移按钮 |
| `sortable` | `true` | 为 `false` 时锁定当前数组索引，并隐含 `draggable=false` |
| `deletable` | `true` | 为 `false` 时隐藏删除按钮 |
| `creatable` | `true` | 为 `false` 或返回禁止决策时，禁止创建该类型的新实例；拖入、复制等 `ADD_NODE` 入口都会被 core 拦截 |
| `actions` | 无 | 控制节点工具栏动作 |

当行为字段为函数时，renderer 在 `computed` 中求值，schema 变更会触发重新计算。

`creatable` 是类型级创建能力，不是物料面板专属开关。凡是会新增 schema node 的交互都必须进入 `ADD_NODE`，由 core 基于当前 schema 统一校验该字段；UI 层可以提前读取同一决策来展示禁用态与原因，但不能把 UI 判断作为唯一约束。

创建规则可以返回布尔值，也可以返回带原因的决策：

```ts
creatable: ({ schema }) => {
  const exists = schema.root.children?.some(child => child.type === 'navbar')
  return exists
    ? {
        allowed: false,
        code: 'singleton.navbar',
        messageKey: 'forbidden.navbarExists',
        message: '页面只能配置一个导航栏',
      }
    : true
}
```

## 位置锁定

`sortable: false` 表示 widget 锁定在当前数组索引位置：

- 该 widget 不可被拖拽。
- 上移/下移按钮不可见。
- 其他 widget 不可插入到会导致该 widget 索引变化的位置。
- 删除其他 widget 时也不能导致锁定 widget 索引变化。

Core 提供位置锁定工具函数：

- `getLockedIndices(children, registry, schema)`。
- `isInsertAllowed(insertIndex, lockedIndices)`。
- `isMoveAllowed(srcIdx, targetIdx, lockedIndices)`。
- `isRemoveAllowed(removeIndex, lockedIndices)`。
- `getValidDropIndices(children, lockedIndices, sourceNodeId)`。
- `findNearestValidIndex(rawIndex, validIndices)`。

## CoreWidgetActionConfig

Per-widget 动作配置用于控制节点工具栏：

```ts
interface CoreWidgetActionConfig {
  only?: string[]
  exclude?: string[]
}
```

Renderer 侧 `wrapper` 与 action `extra` 扩展见 [`.github/architecture/03-designer-and-renderer.md`](./03-designer-and-renderer.md)。

## Core 工具函数

Schema 与容器工具：

- `findNodeById(root, id)`。
- `findParentNode(root, targetId)`。
- `removeNodeFromTree(root, nodeId)`。
- `insertNodeIntoTree(parent, node, index?)`。
- `walkFlatChildren(root, visitor)`。
- `buildSchemaIndex(schema)`：索引 root 节点与一层 region 子节点，并报告多重归属、重复 ID 或嵌套容器。
- `createContainerPlan(node, registry)`：按照当前注册变体投影区域与普通子节点。

## 与其他包协作

- `@dragcraft/designer` 调用 engine API，驱动 UI 和配置变更。
- `@dragcraft/renderer` 消费 schema、选中态、hover 态，并执行节点级命令。
- `@dragcraft/form-generator` 不直接依赖 core，由 designer 桥接字段变更和命令。
- `@dragcraft/widgets` 提供物料定义工具，业务应用向 registry 提供物料元信息。
