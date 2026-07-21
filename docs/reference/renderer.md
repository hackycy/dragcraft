---
description: "@dragcraft/renderer 的 Schema 画布渲染、节点交互扩展、选中投影和容器 region API 参考。"
---

# @dragcraft/renderer

`@dragcraft/renderer` 负责把 schema 节点渲染成真正的 Vue 节点树。

需要实现容器的 region DOM、插入几何或选择交互时，先阅读 [外部容器物料](/guide/container-materials)；本页说明 Renderer 的容器 API。

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

上面的重点不是 `RootRenderer` 组件本身，而是这个包暴露出的交互扩展面。你通常会把 `RootRenderer` 交给 designer 去挂载，再用 `createNodeActionRegistry()` 注册完整的 action definition；如果动作会改 schema，优先使用 `command(ctx, event)`，如果只是副作用，再使用 `handler(ctx, event)`。使用 `createDesigner()` 时，直接传 `customActions`、`actionInterceptors` 和 `extensions.rendererExtensions`；字段、覆盖规则与组件 props 见 [动作与视图扩展](/guide/extending-the-designer)。

要把 Renderer 接入标准工作台，阅读 [集成设计器](/guide/designer-integration)；需要替换工具栏、节点包裹层或画布外壳，阅读 [动作与视图扩展](/guide/extending-the-designer)。

## 容器渲染 API

`useContainerRuntime()` 提供当前 variant、region definitions、region nodes 和受控变体切换。容器组件用 `ContainerRegionOutlet` 放置每个 region；outlet 会渲染区域子节点、空态、插入指示和禁止状态。

```ts
import { ContainerRegionOutlet, useContainerRuntime } from '@dragcraft/renderer'
import { h } from 'vue'

const runtime = useContainerRuntime()

const content = h(ContainerRegionOutlet, {
  regionId: runtime.regionDefinitions.value[0].id,
  resolveDropIndex: ({ event, itemElements }) => {
    for (const [index, element] of itemElements.entries()) {
      const rect = element.getBoundingClientRect()
      if (event.clientY < rect.top + rect.height / 2)
        return index
    }
    return itemElements.length
  },
})
```

`resolveDropIndex` 按容器自己的几何返回 `0` 到区域节点数之间的插入边界；无法确定目标时返回 `null`。固定策略也可以注册为 `RendererWidgetMeta.containerAdapter.resolveDropIndex`。缺少、抛错或返回越界索引时，Renderer 拒绝放置，不会猜测追加位置。

Renderer 不定义 flex/grid geometry。未解析容器保留并展示原始 region 数据，但禁止结构修改。完整的物料定义、约束和变体迁移见 [外部容器物料](/guide/container-materials)。

## 根据节点所有权定制交互

`nodeWrapper`、`nodeMask`、`nodeHandle`、`nodeToolbar` 和 `nodeSelection` 都会收到 `owner: NodeOwner`。`owner.kind` 为 `root` 时，节点属于页面布局；为 `container` 时，节点属于某个容器 region。自定义扩展应使用这个字段选择视觉表现，而不要重新从 Schema 推断父子关系。

```ts
import { defineComponent, h } from 'vue'

const NodeWrapper = defineComponent({
  props: { owner: { type: Object, required: true } },
  setup(props, { slots }) {
    return () => h('div', {
      class: props.owner.kind === 'container'
        ? 'app-node--container-owned'
        : 'app-node--root-owned',
    }, slots.default?.())
  },
})

const extensions = { nodeWrapper: NodeWrapper }
```

root-owned 节点保留物料真实 border box，但其选中语义范围横向覆盖完整 container shell/Device Frame，工具栏位于 Frame 左侧。container-owned 节点的真实范围与选中范围都使用自身 wrapper box，工具栏位于节点上方或下方。已解析容器本身在未选中时使用画布外的语义选择按钮，不发布物料 hover；子节点仍按自己的 mask 或 handle 处理命中。

`rendererExtensions.nodeSelection` 只能替换投影视觉；`projection.materialBounds`、`projection.bounds`、坐标平面和 overflow 裁剪仍由 Renderer 与 `containerShell` 负责。root-owned 节点始终投影到 root 平面；root flow 与 sticky/flow chrome 子树向 container-owned descendants 传播 content 平面，fixed chrome 与 layer 子树传播 viewport 平面。自定义 Frame 如何注册三个平面，见 [主题与设备框架](/guide/themes-and-device-frames)。

Renderer 每个 schema revision 只创建一份深只读快照，并共享对应的 layout plan、ownership index 与 action lock cache。自定义 node action 收到的 `ctx.node`/`ctx.schema` 不可变；自定义 `containerShell` 收到已解析的 vnode 分区、layout plan 和 `surfaceStyle: StyleValueMap`，其中样式值可能是字符串或数字，不应重新读取 schema。
