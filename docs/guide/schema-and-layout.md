# Schema 与布局

这一页会解释两个问题：schema 长什么样，以及节点为什么会进入内容流、chrome 或浮层。

先看一个最小 schema：

```ts
const schema = {
  version: '1.0.0',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [
      { id: 'hero', type: 'banner', props: {} },
    ],
  },
}
```

dragcraft 目前采用扁平模型，真正参与页面编排的是 `root.children`。这意味着设计器不靠嵌套容器树来做拖拽排序。

## 节点为什么会去不同区域

节点通过 `layout.placement` 表达布局意图。

- `flow`：进入普通内容流
- `chrome`：进入页面结构层，比如顶部导航或底部标签栏
- `layer`：进入浮层，比如 FAB 或助手入口

## 为什么布局和渲染要分开

`@dragcraft/core` 先把 `root.children` 投影成 `LayoutPlan`。`@dragcraft/renderer` 再根据这个 plan 生成真正的 Vue 节点。

这样做的结果是，一个 schema 节点只会被布局系统分发一次，不会同时出现在多个区域里。

关于 schema 的基本形状，目前知道这些就够了。准备好之后，继续阅读 [集成设计器](/guide/designer-integration)。
