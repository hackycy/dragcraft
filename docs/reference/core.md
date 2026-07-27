---
description: "@dragcraft/core 的 Schema、命令、历史、事件、容器和迁移公开 API。"
---

# @dragcraft/core

当你需要直接读 Schema、执行命令、处理历史或校验容器时使用 Core。标准 Designer 接入会替你创建 Engine。

```ts
import { CommandType, createEngine } from '@dragcraft/core'

const engine = createEngine()
engine.execute({
  type: CommandType.SET_GLOBAL_CONFIG,
  payload: { config: { title: '首页' } },
})
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `createEngine()` | 创建无 UI 的 Schema Engine。 |
| `engine.execute(command)` | 执行内置或已注册命令。 |
| `engine.state` | 读取深只读 Schema 和交互状态。 |
| `engine.exportSchema()` / `importSchema()` | 交换完整页面快照。 |
| `engine.registerMigration()` | 注册版本间的 Schema 迁移。 |
| `ContainerDefinition`、`createContainerPlan()` | 描述和读取外部容器 region。 |

`engine.store` 的 Schema ref 是只读的。命令成功前，Core 会校验节点所有权、容器约束和 ID；失败命令不会产生历史或 `schema:changed`。

`registerHandler()` 适合直接使用 Core 的基础设施。标准 Designer 项目应优先使用内置 `CommandType`、字段绑定和节点动作，避免让页面协议依赖无文档的自定义命令。

继续阅读 [页面布局与容器](/guide/customization/layout-and-containers) 或 [生命周期与运行时](/guide/customization/lifecycle-and-runtime)。
