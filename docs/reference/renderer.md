# @dragcraft/renderer

`@dragcraft/renderer` 负责把 schema 节点渲染成真正的 Vue 节点树。

先看一个最小示例：

```ts
import { RootRenderer, createNodeActionRegistry } from '@dragcraft/renderer'

const nodeActions = createNodeActionRegistry()
nodeActions.register({
  key: 'duplicate',
  label: '复制',
  type: 'button',
  order: 500,
  handler(ctx, event) {
    event.preventDefault()
    console.log(ctx.node.id)
  },
})
```

上面的重点不是 `RootRenderer` 组件本身，而是这个包暴露出的交互扩展面。你通常会把 `RootRenderer` 交给 designer 去挂载，再用 `createNodeActionRegistry()` 注册完整的 action definition；如果动作会改 schema，优先使用 `command(ctx, event)`，如果只是副作用，再使用 `handler(ctx, event)`。

如果你现在正从 `createDesigner()` 往下排查画布行为，这一页和设计器入口页要一起看。关于 renderer，目前知道这些就够了。准备好之后，继续阅读 [集成设计器](/guide/designer-integration)。
