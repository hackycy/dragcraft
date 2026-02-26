# @dragcraft/core

`@dragcraft/core` 是 dragcraft 的核心引擎，负责所有与 UI 无关的领域能力。

## 目标

- 提供可预测的 schema 状态管理。
- 通过命令系统统一所有写操作。
- 支持 undo/redo、批处理事务、事件广播。
- 为 `@dragcraft/designer` 提供稳定的无框架内核。

## 设计边界

- 不包含任何 DOM/UI 代码（仅使用 `vue` 的响应式 API：`shallowRef`、`ref`、`toRaw`、`triggerRef`）。
- 不关心视觉渲染与样式实现。
- 不直接依赖具体 widget 组件，只依赖协议。

## 快速上手

```ts
import { createEngine, CommandType } from '@dragcraft/core'

const engine = createEngine()

// 注册物料
engine.registerWidget({
  type: 'button',
  title: '按钮',
  group: 'basic',
  defaultProps: { text: 'Click me' },
  formSchema: {},
})

// 添加节点（扁平模型，直接添加到 root.children）
engine.execute({
  type: CommandType.ADD_NODE,
  payload: {
    node: {
      id: 'btn-1',
      type: 'button',
      props: { text: 'Hello' },
    },
  },
})

// 撤销 / 重做
engine.history.undo()
engine.history.redo()

// 事件订阅
engine.eventHub.on('schema:changed', (schema) => {
  console.log('Schema updated:', schema)
})

// 导出 schema
const schema = engine.exportSchema()
```

## 文件结构

```
src/
├── types.ts                  # 所有接口与类型定义
├── constants.ts              # 事件名、命令类型常量
├── helpers.ts                # 扁平列表操作工具函数
├── schema-store.ts           # SchemaStore - 响应式状态管理
├── event-hub.ts              # EventHub - 类型安全的事件总线
├── registry.ts               # Registry - 物料/配置注册中心
├── history-manager.ts        # HistoryManager - undo/redo/事务
├── command-bus.ts            # CommandBus - 命令分发中枢
├── engine.ts                 # createEngine 工厂函数
├── commands/
│   ├── index.ts
│   ├── add-node.ts           # ADD_NODE
│   ├── move-node.ts          # MOVE_NODE
│   ├── remove-node.ts        # REMOVE_NODE
│   ├── update-props.ts       # UPDATE_PROPS
│   └── set-global-config.ts  # SET_GLOBAL_CONFIG
└── index.ts                  # 公共 API barrel export
```

## 核心模块

### 1) SchemaStore

基于 `vue` 的 `shallowRef` / `ref` 实现响应式状态管理（直接依赖 `vue` 而非 `@vue/reactivity`，确保与上层包共享同一 reactivity 实例）。

接口（`SchemaStoreInstance`）：

| 方法 | 说明 |
|------|------|
| `schema` | `ShallowRef<DesignerSchema>` — 响应式 schema 引用 |
| `selectedNodeId` | `Ref<string \| null>` — 当前选中节点 |
| `hoveredNodeId` | `Ref<string \| null>` — 当前 hover 节点 |
| `dragTarget` | `Ref<DragTarget \| null>` — 拖拽目标信息 |
| `getSchema()` | 返回 schema 深拷贝（安全导出） |
| `getRawSchema()` | 返回原始 schema 对象（命令处理器 in-place 修改用） |
| `setSchema(schema)` | 替换整个 schema（深拷贝后赋值） |
| `selectNode(id \| null)` | 设置选中节点 |
| `hoverNode(id \| null)` | 设置 hover 节点 |
| `setDragTarget(target \| null)` | 设置拖拽目标 |
| `getNodeById(id)` | 按 ID 查找节点（在 root.children 中线性查找） |
| `patchNode(nodeId, partial)` | 局部更新节点 props/style |
| `triggerUpdate()` | 手动触发响应式通知 |

### 2) CommandBus

所有写操作统一通过命令系统执行，保证数据流单向。

接口（`CommandBusInstance`）：

| 方法 | 说明 |
|------|------|
| `execute(command)` | 执行命令：快照 → 处理器 → 触发响应式 → 发事件 |
| `registerHandler(type, handler)` | 注册自定义命令处理器 |

内置命令类型（`CommandType`）：

- `ADD_NODE` — 添加 widget 到 root.children 扁平列表
- `MOVE_NODE` — 在 root.children 中重排序
- `REMOVE_NODE` — 删除节点
- `UPDATE_PROPS` — 更新节点 props/style
- `SET_GLOBAL_CONFIG` — 更新全局配置

### 3) HistoryManager

基于快照的 undo/redo，支持事务批处理。

接口（`HistoryManagerInstance`）：

| 方法 | 说明 |
|------|------|
| `undo()` | 撤销上一步操作 |
| `redo()` | 重做 |
| `canUndo()` | 是否可撤销 |
| `canRedo()` | 是否可重做 |
| `beginTransaction(label?)` | 开始事务（多命令合并为一条历史） |
| `commitTransaction()` | 提交事务 |
| `discardTransaction()` | 丢弃事务（回滚到事务前状态） |
| `isInTransaction()` | 是否在事务中 |
| `clear()` | 清空历史 |

### 4) Registry

物料与配置 schema 的注册中心。

接口（`RegistryInstance`）：

| 方法 | 说明 |
|------|------|
| `registerWidget(meta)` | 注册 widget 元信息 |
| `registerGlobalConfigSchema(schema)` | 注册全局配置表单 schema |
| `getWidget(type)` | 获取 widget 元信息 |
| `getGlobalConfigSchema()` | 获取全局配置 schema |
| `getAllWidgets()` | 获取所有已注册 widget |

### 5) EventHub

封装 `@dragcraft/utils` 的 `EventEmitter`，提供类型安全的事件总线。

内置事件（`EventName`）：

| 事件名 | 触发时机 |
|--------|----------|
| `schema:changed` | schema 变更后 |
| `selection:changed` | 选中节点变化 |
| `history:changed` | 历史栈变化 |
| `node:added` | ADD_NODE 执行后 |
| `node:removed` | REMOVE_NODE 执行后 |
| `node:moved` | MOVE_NODE 执行后 |
| `node:updated` | UPDATE_PROPS 执行后 |
| `global-config:changed` | SET_GLOBAL_CONFIG 执行后 |
| `drag:enter` / `drag:over` / `drag:leave` / `drag:drop` | 拖拽生命周期 |

### 6) Engine（主入口）

`createEngine(options?)` 工厂函数，组装所有子系统。

```ts
interface DesignerEngine {
  // 子系统直接访问
  store: SchemaStoreInstance
  commandBus: CommandBusInstance
  history: HistoryManagerInstance
  registry: RegistryInstance
  eventHub: EventHub

  // 便捷方法
  execute(command): void
  registerHandler(type, handler): void
  registerWidget(meta): void
  exportSchema(): DesignerSchema
  importSchema(schema): void
  dispose(): void
}
```

## 数据模型

### 节点结构

```ts
interface SchemaNode {
  id: string
  type: string
  props: Record<string, unknown>
  style?: Record<string, unknown>
  children?: SchemaNode[]  // 仅 root 节点使用
}
```

### 文档结构

```ts
interface DesignerSchema {
  version: string
  globalConfig: Record<string, unknown>
  root: SchemaNode
}
```

### 物料协议

```ts
interface WidgetMeta {
  type: string
  title: string
  group: string
  icon?: string
  defaultProps: Record<string, unknown>
  defaultStyle?: Record<string, unknown>
  formSchema: Record<string, unknown>

  // ── 渲染行为控制 ──
  mask?: boolean        // 默认 true，控制画布中是否覆盖透明遮罩
  selectable?: boolean  // 默认 true，是否允许在画布中选中
  draggable?: boolean   // 默认 true，是否允许拖拽排序
  deletable?: boolean   // 默认 true，是否允许通过工具栏删除

  // ── Action 系统 ──
  actions?: WidgetActionConfig  // Per-widget 工具栏动作配置

  // ── 自定义包裹 ──
  wrapper?: Component   // 覆盖全局 nodeWrapper 扩展，针对该 widget 类型自定义包裹组件
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `selectable` | `boolean` | `true` | 为 `false` 时节点无法被点击选中 |
| `draggable` | `boolean` | `true` | 为 `false` 时隐藏拖拽 handle 和上移/下移按钮 |
| `deletable` | `boolean` | `true` | 为 `false` 时隐藏删除按钮 |
| `actions` | `WidgetActionConfig` | — | 控制工具栏可用动作（详见下方） |
| `wrapper` | `Component` | — | 自定义该 widget 类型的包裹组件，接收 `NodeWrapperProps` |

### WidgetActionConfig（Per-Widget 动作配置）

```ts
interface WidgetActionConfig {
  /** 仅保留指定 key 的动作 */
  only?: string[]
  /** 排除指定 key 的动作 */
  exclude?: string[]
  /** 追加自定义动作定义 */
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

示例——注册一个不可删除、只保留拖拽和上移/下移的 widget：

```ts
engine.registerWidget({
  type: 'header',
  title: '页头',
  group: 'layout',
  defaultProps: {},
  formSchema: {},
  deletable: false,
  actions: {
    exclude: ['delete'],
  },
})
```

### 命令 Payload

```ts
interface AddNodePayload {
  node: SchemaNode
  index?: number      // root.children 中的插入位置，默认追加末尾
}

interface MoveNodePayload {
  nodeId: string
  index: number        // root.children 中的目标位置
}

interface RemoveNodePayload {
  nodeId: string
}
```

## 命令执行流程

```
engine.execute({ type, payload })
    │
    ▼
CommandBus
  1. cloneDeep 快照 → history.pushSnapshot()
  2. handler(ctx, payload)  ── 原始对象 in-place 修改
  3. store.triggerUpdate()  ── shallowRef triggerRef
  4. eventHub.emit(事件)    ── 领域事件 + schema:changed
```

## 工具函数

导出供外部使用（扁平列表操作）：

- `findNodeById(root, id)` — 在 root.children 中线性查找节点
- `findParentNode(root, targetId)` — 查找父节点及索引（parent 始终为 root）
- `removeNodeFromTree(root, nodeId)` — 从 root.children 中移除节点
- `insertNodeIntoTree(parent, node, index?)` — 插入节点到 children 列表
- `walkTree(root, visitor)` — 遍历 root + root.children

## 与其他包协作

- `@dragcraft/designer`：调用 engine 的 command/api/event，驱动 UI。
- `@dragcraft/renderer`：订阅 schema，执行节点渲染。
- `@dragcraft/form-generator`：读取配置 schema，并提交 props 更新命令。
- `@dragcraft/widgets`：向 registry 注入默认 widget 元信息。

## 稳定性约束

- 所有写操作必须走 `CommandBus`。
- 所有导出 schema 必须经过 `version` 校验。
- 事件名称采用命名空间（`namespace:action`），避免冲突。
- undo/redo 直接恢复快照，不经过 CommandBus（避免循环）。

## 里程碑

1. ~~完成核心类型与 schema 读写。~~ ✅
2. ~~完成命令系统与历史回放。~~ ✅
3. ~~完成注册中心与事件协议。~~ ✅
4. 补齐单元测试（命令、历史、迁移）。
