# @dragcraft/core

`@dragcraft/core` 负责 schema、命令和历史记录。

需要实现可承载子节点的 flex、grid 或分栏物料时，先阅读 [外部容器物料](/guide/container-materials)；本页说明 Core 提供的容器 API。

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

## Container public API

`root.children` 包含页面节点，`flow/chrome/layer` 保持 root-only；容器 regions 拥有普通子节点，当前协议拒绝嵌套容器。`container` 是兼容现有文档的可选字段，因此 schema version 不变。

主要入口包括 `validateContainerDefinition()`、`createContainerState()`、`createContainerPlan()`、`resolvePlacementDecision()`、`buildSchemaIndex()` 和 `validateSchema()`。`NodeDestination` 显式区分 root 与 container region，所有跨 owner 的 add/move/remove/copy 都通过结构化 command result 保证拒绝回滚与 undo 一致性。外部 meta 注册 variants、regions、constraints 和 material-owned migration；框架不定义 flex/grid geometry。
