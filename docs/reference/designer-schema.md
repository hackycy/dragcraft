---
description: "通过 @dragcraft/designer 使用 Schema、命令、历史、事件、容器和迁移接口。"
---

# Schema 与命令

Designer 创建并持有页面 Engine，所有 Schema 写入都经过命令接口。

```ts
import { CommandType, createEngine } from '@dragcraft/designer'

const engine = createEngine()
engine.execute({
  type: CommandType.SET_GLOBAL_CONFIG,
  payload: { config: { title: '首页' } },
})
```

| 入口 | 用途 |
| --- | --- |
| `createEngine()` | 创建不挂载工作台的 Schema Engine。 |
| `engine.execute(command)` | 执行内置或已注册命令。 |
| `engine.state` | 读取深只读 Schema 和交互状态。 |
| `engine.exportSchema()` / `importSchema()` | 交换完整页面快照。 |
| `engine.registerMigration()` | 注册版本间的 Schema 迁移。 |
| `ContainerDefinition`、`createContainerPlan()` | 描述和读取外部容器 region。 |

`engine.store` 的 Schema ref 是只读的。命令成功前会校验节点所有权、容器约束和 ID；失败命令不会产生历史或 `schema:changed`。标准项目优先使用内置 `CommandType`、字段绑定和节点动作。

## 命令结果

| 结果 | 含义 |
| --- | --- |
| `{ ok: true, changed: true }` | 新快照已经提交，并写入历史和事件。 |
| `{ ok: true, changed: false }` | 命令有效但数据相同，不提交历史和事件。 |
| `{ ok: false, code, ... }` | 命令被拒绝，draft 被丢弃。 |

读取 `code` 处理稳定失败分类，读取 `messageKey`、`message` 和 `details` 补充用户提示。完整写入语义见 [状态、命令、历史与事件](/guide/fundamentals/state-commands-and-history)。

## 历史、事件与迁移

| 入口 | 用途 |
| --- | --- |
| `engine.history.undo()` / `redo()` | 在已提交快照之间切换。 |
| `beginTransaction()` / `commitTransaction()` | 将多条命令合并为一次撤销。 |
| `discardTransaction()` | 回滚事务开始后的全部命令。 |
| `engine.eventHub.on()` / `off()` | 订阅 Schema、history、selection 和节点事件。 |
| `engine.registerMigration()` | 注册一个纯 Schema 版本转换步骤。 |
| `engine.importSchema()` | 迁移并验证完整页面，返回 diagnostics。 |

`importSchema()` 成功后清空旧页面 history；失败时保留当前快照。Schema 结构、样式作用域和 migration 顺序见 [Schema 与样式作用域](/guide/fundamentals/schema)。

## Schema 托管物料

导航栏、底部栏等由页面模板固定提供的物料，可以注册为 Schema 托管物料。完整的 metadata 与初始节点范例见 [动作与业务策略](/guide/customization/actions-and-policies#schema-托管物料)：

```ts
import type { DesignerWidgetMeta } from '@dragcraft/designer'

const navbarMeta: DesignerWidgetMeta = {
  type: 'navbar',
  title: '导航栏',
  group: 'chrome',
  authoring: 'schema-managed',
  defaultProps: {},
  formSchema: { sections: [] },
  defaultLayout: {
    placement: { kind: 'chrome', edge: 'block-start', position: 'fixed' },
  },
}
```

这类物料不出现在标准物料面板中，也不能通过 `ADD_NODE` 或 duplicate 创建。已有实例默认仍可选中和编辑属性，但不可移动、删除或切换容器 variant。可以用 `selectable`、`configurable`、`draggable`、`sortable`、`deletable`、`variantChangeable` 和 `actions` 按实例开放能力；创建与复制始终禁止。`draggable: true` 开启移动；只有需要锁住绝对 sibling 下标时才设为 `sortable: false`。

限制会传播到候选子树：复制包含托管后代的普通容器会被拒绝，删除普通父容器也要求所有托管后代允许删除。`importSchema()`、注册的 migration 和 custom command 是可信宿主入口，不应被当作不可信插件沙箱。
