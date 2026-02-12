# @dragcraft/core

`@dragcraft/core` 是 dragcraft 的核心引擎，负责所有与 UI 无关的领域能力。

## 目标

- 提供可预测的 schema 状态管理。
- 通过命令系统统一所有写操作。
- 支持 undo/redo、批处理事务、事件广播。
- 为 `@dragcraft/designer` 提供稳定的无框架内核。

## 设计边界

- 不包含任何 Vue/DOM/UI 代码。
- 不关心视觉渲染与样式实现。
- 不直接依赖具体 widget 组件，只依赖协议。

## 核心模块

### 1) SchemaStore

职责：

- 保存页面 schema（root/container/widget 节点树）。
- 维护选中态、hover 态、拖拽目标态等运行时状态。
- 提供快照读取与按路径更新能力。

建议接口：

- `getState()`
- `setState(nextState)`
- `selectNode(nodeId | null)`
- `patchNode(nodeId, partialProps)`

### 2) CommandBus

职责：

- 承接所有变更类操作，保证数据流单向。
- 内置命令：`ADD_NODE`、`MOVE_NODE`、`REMOVE_NODE`、`UPDATE_PROPS`、`SET_GLOBAL_CONFIG`。

建议接口：

- `execute(command)`
- `registerHandler(type, handler)`

### 3) HistoryManager

职责：

- 支持 `undo()` / `redo()`。
- 支持事务：多个命令合并为一次历史记录。
- 限制最大历史数

建议接口：

- `undo()`
- `redo()`
- `beginTransaction(label?)`
- `commitTransaction()`
- `discardTransaction()`

### 4) Registry

职责：

- 注册 widget 元信息与默认 props。
- 注册容器类型（用于画布容器壳定制）。
- 注册配置 schema（全局配置 + widget 配置）。

建议接口：

- `registerWidget(meta)`
- `registerContainer(meta)`
- `registerGlobalConfigSchema(schema)`
- `getWidget(type)`

### 5) EventHub

职责：

- 分发核心领域事件，供 designer/renderer/form-generator 订阅。

关键事件建议：

- `schema:changed`
- `selection:changed`
- `drag:enter` / `drag:over` / `drag:leave` / `drag:drop`
- `history:changed`

## 数据模型建议

### 节点结构

```ts
type NodeType = 'container' | 'widget'

interface SchemaNode {
  id: string
  type: string
  nodeType: NodeType
  props: Record<string, unknown>
  style?: Record<string, unknown>
  children?: SchemaNode[]
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

## 与其他包协作

- `@dragcraft/designer`：调用 core 的 command/api/event，驱动 UI。
- `@dragcraft/renderer`：订阅 schema，执行节点渲染。
- `@dragcraft/form-generator`：读取配置 schema，并提交 props 更新命令。
- `@dragcraft/widgets`：向 registry 注入默认 widget 元信息。

## 稳定性约束

- 所有写操作必须走 `CommandBus`。
- 所有导出 schema 必须经过 `version` 校验。
- 事件名称采用命名空间，避免冲突。

## 里程碑

1. 完成核心类型与 schema 读写。
2. 完成命令系统与历史回放。
3. 完成注册中心与事件协议。
4. 补齐单元测试（命令、历史、迁移）。
