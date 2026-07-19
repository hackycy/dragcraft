# Schema 与布局

页面的顶层节点放在 `root.children`，布局系统再把它们投影到内容流、页面 chrome 和浮层。普通物料保持扁平；外部容器本身也是顶层节点，但它的普通子节点保存在 `container.regions`。

先看一个同时包含三种区域的页面：

```ts
const schema = {
  version: '1.0.0',
  globalConfig: { title: '商品详情' },
  root: {
    id: 'root',
    type: 'root',
    props: {},
    style: { surface: { backgroundColor: '#f7f7f7' } },
    children: [
      { id: 'hero', type: 'banner', props: {} },
      {
        id: 'tabbar', type: 'tab-bar', props: {},
        layout: { placement: { kind: 'chrome', edge: 'block-end', position: 'fixed' } },
      },
      {
        id: 'help', type: 'floating-button', props: {},
        layout: { placement: { kind: 'layer', mode: 'self' } },
      },
      {
        id: 'layout', type: 'two-column', props: {},
        container: {
          variant: 'default',
          regions: {
            left: [{ id: 'headline', type: 'text', props: { content: '新品' } }],
            right: [],
          },
        },
      },
    ],
  },
}
```

`hero` 和 `layout` 没有布局声明，因此进入默认内容流；Tab 栏进入固定的页面结构层；浮动按钮进入单独的 layer。`layout` 的 `left` 和 `right` 不参与 root 的 `LayoutPlan`，它们由容器自己的 region 定义和组件几何渲染。

容器节点只能位于 `root.children`，region 只能包含普通节点，当前不支持嵌套容器。容器的 Schema、拖放和变体迁移见 [外部容器物料](/guide/container-materials)。

## 三种样式作用域

Schema 的 style 是跨端 DSL，不绑定浏览器 CSS。设计器预览会把它解释为 inline style，其他运行时可以映射为自己的样式系统。

| 字段 | 作用对象 | 典型内容 |
| --- | --- | --- |
| `style.container` | 节点外层布局盒子 | `marginTop`、`width`、`padding` |
| `style.content` | 物料组件内容 | `color`、`fontSize` |
| `style.surface` | 页面或承载面的背景 | `backgroundColor`、`backgroundImage` |

全局表单编辑页面背景时，应显式绑定到 `root.style.surface.*`，而不是把可视样式混入 `globalConfig`。

## 为什么布局不是组件自己决定

core 先从节点和物料默认布局生成 `LayoutPlan`，renderer 再按 plan 渲染。一个节点只会被分发一次，因此不会同时出现在内容区和固定栏中。

- `flow`：普通内容流，可按 `sortScope` 排序。
- `chrome`：导航栏、Tab 栏等结构节点，可声明固定、sticky 和内容避让。
- `layer`：悬浮按钮、助手等覆盖层，可由框架或物料自行定位。

需要把这份 Schema 接入 Vue 应用时，继续阅读 [集成设计器](/guide/designer-integration)。
