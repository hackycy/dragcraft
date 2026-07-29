---
description: "通过 @dragcraft/designer 使用 Schema、命令、历史、事件、容器和迁移接口。"
---

# Schema 与命令

Designer 创建并持有页面 Engine，所有 Schema 写入都经过命令接口。

先完成 [保存 Schema，并通过命令写入](/guide/learn/schema-and-write-path)；容器和模板节点分别见 [业务容器](/guide/learn/containers) 与 [Schema 托管动作](/guide/learn/schema-managed-actions)。

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
