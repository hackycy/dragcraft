# Schema 与 Core Engine

`@dragcraft/core` 是 dragcraft 的领域内核，提供与 UI 无关的状态、命令、历史、注册、事件和布局投影能力。

## 设计边界

- 不包含 DOM 或 UI 代码。
- 不关心视觉渲染与样式。
- 不直接依赖具体 widget 组件，只依赖协议。
- 使用 Vue 的响应式 API 与上层包共享同一 reactivity 实例。
- 所有 schema 写操作统一进入 `CommandBus`。

## Schema 模型

Schema 采用扁平 widget 列表模型，无树结构、无容器嵌套：

```ts
interface SchemaNode {
  id: string
  type: string
  props: Record<string, unknown>
  style?: Record<string, unknown>
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
```

核心规则：

- `root.children` 是扁平 widget 数组。
- 不存在 `nodeType`，不区分容器和 widget。
- 不支持嵌套子节点，`children` 仅 root 保留。
- `layout.placement` 声明节点进入内容流、固定 chrome 还是浮层。
- `flow.sortScope` 是开放排序域，`false` 表示节点不参与画布拖拽排序。

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

Renderer 负责把 `LayoutPlan` 分发为 `regionVNodes`、`chromeVNodes` 和 `layerVNodes` 交给 `containerShell`。Shell 不重新读取 schema，不创建业务 widget vnode，只执行 content scrollport、chrome layer、floating layer 和 inset 写入。

## Core 文件结构

```plaintext
src/
├── types.ts
├── constants.ts
├── helpers.ts
├── layout.ts
├── sortable.ts
├── schema-store.ts
├── event-hub.ts
├── registry.ts
├── history-manager.ts
├── command-bus.ts
├── engine.ts
├── commands/
│   ├── add-node.ts
│   ├── move-node.ts
│   ├── remove-node.ts
│   ├── update-props.ts
│   └── set-global-config.ts
└── index.ts
```

## 核心模块

### SchemaStore

`SchemaStore` 基于 `shallowRef`、`ref` 和 `triggerRef` 管理响应式状态。

主要能力：

- `schema`：响应式 schema 引用。
- `selectedNodeId`：当前选中节点。
- `hoveredNodeId`：当前 hover 节点。
- `dragTarget`：拖拽目标信息。
- `getSchema()`：返回 schema 深拷贝，用于安全导出。
- `getRawSchema()`：返回原始 schema 对象，供命令处理器原地修改。
- `setSchema(schema)`：替换整个 schema。
- `selectNode(id | null)`、`hoverNode(id | null)`、`setDragTarget(target | null)`。
- `getNodeById(id)`：在 `root.children` 中线性查找。
- `applyTransientPatch(nodeId, partial)`：局部更新 props/style，不触发历史快照和事件。
- `triggerUpdate()`：手动触发响应式通知。

### CommandBus

`CommandBus` 是所有写操作入口。

内置命令：

- `ADD_NODE`：添加 widget 到目标排序域，`index` 表示插入点。
- `MOVE_NODE`：在节点所属 `sortScope` 中重排序。
- `REMOVE_NODE`：删除节点。
- `UPDATE_PROPS`：更新节点 props/style。
- `SET_GLOBAL_CONFIG`：更新全局配置。

命令执行流程：

```plaintext
engine.execute({ type, payload })
  -> CommandBus
  -> cloneDeep 快照并写入 history
  -> handler(ctx, payload) 原地修改原始 schema
  -> store.triggerUpdate()
  -> eventHub.emit()
```

### HistoryManager

历史管理基于快照，支持 undo、redo 和事务批处理。

主要能力：

- `undo()`、`redo()`。
- `canUndo()`、`canRedo()`。
- `beginTransaction(label?)`、`commitTransaction()`、`discardTransaction()`。
- `isInTransaction()`、`clear()`。

undo/redo 直接恢复快照，不经过 `CommandBus`，避免历史回放再次写入历史。

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

```ts
interface DesignerEngine {
  store: SchemaStoreInstance
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

`WidgetMeta` 描述物料注册信息与画布行为：

```ts
interface WidgetMeta {
  type: string
  title: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  defaultStyle?: Record<string, unknown>
  formSchema: Record<string, unknown>

  mask?: BehaviorPredicate<InstanceBehaviorContext>
  selectable?: BehaviorPredicate<InstanceBehaviorContext>
  draggable?: BehaviorPredicate<InstanceBehaviorContext>
  sortable?: BehaviorPredicate<InstanceBehaviorContext>
  deletable?: BehaviorPredicate<InstanceBehaviorContext>

  creatable?: BehaviorPredicate<TypeBehaviorContext>
  actions?: WidgetActionConfig
  wrapper?: Component
}
```

行为字段支持静态布尔值或运行时谓词函数：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `mask` | `true` | 为 `false` 时不渲染透明遮罩，允许直接交互 |
| `selectable` | `true` | 为 `false` 时节点无法点击选中 |
| `draggable` | `true` | 为 `false` 时隐藏拖拽 handle 和上移/下移按钮 |
| `sortable` | `true` | 为 `false` 时锁定当前数组索引，并隐含 `draggable=false` |
| `deletable` | `true` | 为 `false` 时隐藏删除按钮 |
| `creatable` | `true` | 为 `false` 时禁止创建该类型的新实例；物料面板禁用，拖入、复制等 `ADD_NODE` 入口都会被 core 拦截 |
| `actions` | 无 | 控制节点工具栏动作 |
| `wrapper` | 无 | 为该 widget 类型覆盖全局 nodeWrapper |

当行为字段为函数时，renderer 在 `computed` 中求值，schema 变更会触发重新计算。

`creatable` 是类型级创建能力，不是物料面板专属开关。凡是会新增 schema node 的交互都必须进入 `ADD_NODE`，由 core 基于当前 schema 统一校验该字段；UI 层仍可提前读取同一谓词来禁用物料、复制等入口，但不能把 UI 判断作为唯一约束。

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

## WidgetActionConfig

Per-widget 动作配置用于控制节点工具栏：

```ts
interface WidgetActionConfig {
  only?: string[]
  exclude?: string[]
  extra?: Array<{
    key: string
    label: string
    icon?: string | Component
    type: 'button' | 'drag-handle'
    order: number
    visible?: (ctx) => boolean
    disabled?: (ctx) => boolean
    handler?: (ctx, e: MouseEvent) => void
    className?: string
  }>
}
```

## Core 工具函数

扁平列表工具：

- `findNodeById(root, id)`。
- `findParentNode(root, targetId)`。
- `removeNodeFromTree(root, nodeId)`。
- `insertNodeIntoTree(parent, node, index?)`。
- `walkFlatChildren(root, visitor)`。

## 与其他包协作

- `@dragcraft/designer` 调用 engine API，驱动 UI 和配置变更。
- `@dragcraft/renderer` 消费 schema、选中态、hover 态，并执行节点级命令。
- `@dragcraft/form-generator` 不直接依赖 core，由 designer 桥接字段变更和命令。
- `@dragcraft/widgets` 提供物料定义工具，业务应用向 registry 提供物料元信息。
