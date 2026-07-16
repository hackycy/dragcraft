# 运行时集成边界

生产运行时接收已经发布的 Schema，并使用与设计器相同的业务物料协议解释节点。它不应直接复用编辑态的交互层。

先定义最小的运行时渲染约定：

```ts
import type { DesignerSchema, SchemaNode } from '@dragcraft/core'
import type { Component } from 'vue'
import { h } from 'vue'

function renderNodes(schema: DesignerSchema, componentMap: Record<string, Component>) {
  return (schema.root.children ?? []).map((node) => {
    const Widget = componentMap[node.type]
    if (!Widget)
      return null

    return h('div', { style: node.style?.container }, [
      h(Widget, { ...node.props, style: node.style?.content }),
    ])
  })
}
```

这个示例只渲染普通的 root 节点：`node.type` 查找组件，`props` 传给组件，`style.container` 与 `style.content` 分别控制外层和内容。真实运行时还应解释 `root.style.surface`、`layout.placement`、可见性和业务事件。

## 在生产运行时消费容器

外部容器的 region 子节点不在 `root.children` 中，因此上面的最小示例不会渲染它们。生产运行时需要为容器建立自己的只读渲染契约：读取 `node.container.variant` 和 `node.container.regions`，递归渲染 region 节点，再把结果交给业务容器组件。

```ts
type RuntimeContainerMap = Record<string, Component>

function renderNode(
  node: SchemaNode,
  componentMap: Record<string, Component>,
  containerMap: RuntimeContainerMap,
) {
  if (!node.container) {
    const Widget = componentMap[node.type]
    return Widget ? h(Widget, { ...node.props }) : null
  }

  const Container = containerMap[node.type]
  if (!Container)
    return null

  const regions = Object.fromEntries(
    Object.entries(node.container.regions).map(([regionId, children]) => [
      regionId,
      children.map(child => renderNode(child, componentMap, containerMap)),
    ]),
  )

  return h(Container, {
    node,
    variant: node.container.variant,
    regions,
  })
}
```

这里的 `RuntimeContainerMap` 是业务应用自己的契约。容器组件决定如何把 `regions.left`、`regions.right` 等节点树放进自身 DOM；dragcraft 不为生产运行时定义 flex、grid 或分栏几何。不要在生产页面调用编辑态的 `ContainerRegionOutlet` 或 `useContainerRuntime()`。

## 编辑态与生产态不同

`@dragcraft/renderer` 的 `RootRenderer` 面向设计器画布，包含选中框、拖拽、节点工具栏和 mask 等编辑交互。当前它不是生产用的 read-only runtime 组件。

因此接入有两种选择：

- 你的业务已有页面运行时：实现上面的 Schema adapter，并让它消费同一份 `componentMap` 与物料契约。
- 你的业务需要库提供运行时：先在产品层确定只读 renderer 的 API、事件模型与跨端目标，再将其作为独立运行时包接入。不要在文档中把编辑 renderer 描述成生产渲染器。

## 发布前需要校验什么

运行时和服务端至少应共同确认：

- 每个 `node.type` 都在当前发布物料集合中。
- 节点 `props`、页面 `globalConfig` 和资源 URL 满足业务规则。
- `layout.placement` 中的 chrome、flow 和 layer 能被目标平台解释。
- 容器节点的 variant、region ID、子节点类型和容量约束与当前物料定义一致。
- 未识别物料有可观测的降级或阻断策略，不能静默丢失页面内容。

设计器预览与生产页面可以共享物料组件，但不应共享编辑态的选择和拖拽交互。关于库目前提供的渲染扩展点，继续阅读 [@dragcraft/renderer](/reference/renderer)。
