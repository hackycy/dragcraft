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
