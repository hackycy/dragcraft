# @dragcraft/renderer

`@dragcraft/renderer` 负责把 schema 节点渲染成真正的 Vue 节点树。

容器渲染边界见 [Container Schema DSL 设计](https://github.com/hackycy/dragcraft/blob/main/docs/superpowers/specs/2026-07-13-container-schema-dsl-design.md)，可直接跳到本页的 [Container renderer API](#container-renderer-api)。

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

## Container renderer API

`useContainerRuntime()` 提供当前 variant、region definitions、region nodes 和受控 variant change。`ContainerRegionOutlet` 渲染每个普通子节点一次，并承载区域空态、active/forbidden 状态和 drop 回调。

框架 package 不定义 flex/grid geometry。外部物料创建区域 DOM/CSS，并通过 outlet 的 `resolveDropIndex` 或 `RendererWidgetMeta.containerAdapter` 注册 drop adapter；`ResolveContainerDropIndexContext` 提供事件、region element、item elements 和 nodes。缺少或失败的 adapter 会返回结构化拒绝，不会猜测 append。未解析容器继续保留并展示原始 region 数据。

Renderer 根据 `NodeOwner` 统一决定编辑态几何：root-owned 节点保留 viewport 宽度的选区与 frame 左侧纵向工具栏，container-owned 节点使用 framework wrapper 的可见 border box，并在右上方显示水平工具栏。工具栏空间不足时翻转到右下方并限制在画布 viewport 内。外部容器拥有布局和 drop geometry，但不能覆盖选择几何；自定义 `nodeWrapper`、`nodeMask`、`nodeHandle` 和 `nodeToolbar` 会收到当前 `owner`。

父子节点命中时，最深可选节点独占 hover。resolved container 只从自身空白选择，子节点继续遵守各自的 blocking mask 或 unmasked handle 契约。完全被子节点覆盖的父容器通过结构面板选择。
