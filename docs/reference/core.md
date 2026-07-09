# @dragcraft/core

`@dragcraft/core` 负责 schema、命令和历史记录。

先看一个最小示例：

```ts
import { createEngine, CommandType } from '@dragcraft/core'

const engine = createEngine()

engine.execute({
  type: CommandType.SET_GLOBAL_CONFIG,
  payload: {
    config: {
      title: '首页',
    },
  },
})

const schema = engine.state.getSchema()
console.log(schema.globalConfig.title)
```

这段代码展示了这个包最常见的读写节奏。我们先用 `createEngine()` 创建实例，再通过命令对象调用 `engine.execute()`，最后用 `engine.state.getSchema()` 读取公开状态。

如果你在扩展布局、事件或拖拽约束，下一步再看 `createLayoutPlan()`、`EventName` 和 `resolveBehavior()` 这一组入口。关于这一层目前知道这些就够了。准备好之后，继续阅读 [Schema 与布局](/guide/schema-and-layout)。
