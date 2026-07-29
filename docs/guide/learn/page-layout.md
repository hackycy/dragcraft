---
description: "让页面节点进入内容流、固定 Chrome 或浮层，并理解布局意图如何保存到 Schema。"
---

# 安排内容、Chrome 和浮层

## 预期结果

页面顶层节点都放在 `root.children`，但它们不一定都在同一个视觉区域。`layout.placement` 告诉 Renderer 节点进入普通内容流、页面 Chrome 还是浮层。

完成本页后，活动页会有一个随页面保存在 Schema 中的页头。你也能判断一个组件应该使用 `flow`、`chrome` 还是 `layer`。

## 前置状态

你已经完成草稿保存和只读预览。当前活动页只有普通内容节点，全部按默认 `flow` 进入内容区。

先记住三个 placement：

| Placement | 用于 | 默认排序行为 |
| --- | --- | --- |
| `flow` | 正文、卡片、公告和普通内容 | 进入 `content`，可排序 |
| `chrome` | 导航栏、标签栏等页面结构 | 不参与内容排序 |
| `layer` | FAB、气泡和悬浮助手 | 不参与内容排序 |

没有 `layout` 的普通节点默认使用 `flow`。因此公告不需要声明布局也会进入内容区。

## 完整文件

### 为页头声明默认布局

活动页的页头不是由宿主布局硬编码出来的。它是一个 Schema 节点，组件定义提供默认放置意图，初始 Schema 保存实际的 `layout`。

`src/domain/widgets/page-header.ts`：

<<< ../../../examples/guide-project/src/domain/widgets/page-header.ts

`defaultLayout` 会在创建该物料时提供默认值。已经保存的节点仍应在 Schema 中携带自己的 `layout`，这样导入历史页面时不会依赖当前物料定义猜测布局。

`src/editor/create-guide-schema.ts`：

<<< ../../../examples/guide-project/src/editor/create-guide-schema.ts

页头的 `sticky` 放在内容滚动区顶部。把 `position` 改为 `fixed` 时，`reserve` 决定内容是否为它预留空间；导航栏和底部栏通常使用 `fixed` 加 `reserve`，避免内容被遮住。

新建 `src/editor/create-layout-designer.ts`，把页头和文本/公告物料注册到这一阶段的编辑器：

<<< ../../../examples/guide-project/src/editor/create-layout-designer.ts

在宿主 `App.vue` 中把 `createActivityDesigner()` 替换为 `createLayoutDesigner()`。现在页头会出现，但分栏容器和节点动作仍未加入。

## 立即可观察行为

在宿主 `App.vue` 中把 `createActivityDesigner()` 替换为 `createLayoutDesigner()`。页头会出现在活动页顶部；公告仍在内容区，拖动公告不会改变页头位置。

## 设计原因

### Renderer 得到的布局结果

你不需要在业务代码中手工创建 `LayoutPlan`。Renderer 每次读取 Schema 时会根据注册物料的默认布局和节点自身的 `layout` 生成它；这个结果把同一份 `root.children` 投影到不同的画布区域。

| Schema placement | `LayoutPlan` 中的结果 | 画布行为 |
| --- | --- | --- |
| `flow` | 一个内容 region 和可排序 scope | 按内容区顺序渲染和排序 |
| `chrome` | Chrome 列表与 content inset | 固定或吸附在页面边缘，按 reserve 避让内容 |
| `layer` | 按 layer 名称分组的浮层 | 从内容流分离，按 anchor 或组件自身定位 |

因此不要在业务组件里重复计算页面级位置。业务组件只负责自己的 DOM 和样式，Renderer 保持页面级排序、安全区、避让和编辑态选区的一致性。

### 选择合适的模式

普通页面内容使用 `flow`。需要固定在设备边缘的导航或底栏使用 `chrome`。简单悬浮按钮可以使用 `layer` 的 `framework` 模式；组件要自行根据安全区或 Chrome 定位时使用 `self` 模式。

```ts
const floatingButtonLayout = {
  placement: {
    kind: 'layer',
    mode: 'framework',
    anchor: { block: 'end', inline: 'end' },
  },
}
```

不要用普通 CSS 的 `position: fixed` 代替 `chrome` 或 `layer`。那样节点仍会被当作内容流排序，设备外壳、安全区、内容避让和编辑态选区也无法得到一致的结果。

## 限制与下一步

页面 placement 只处理根节点在页面 surface 中的位置，不能让一个节点拥有子节点。分栏和网格要使用下一页的容器 region 协议。

## 完成检查

- 初始页头显示在活动页顶部，选中后仍可以在右侧编辑标题。
- 公告仍在内容区域，拖动公告不会改变页头的位置。
- 你能说明为什么固定导航要使用 `chrome`，而不是给普通组件添加 `position: fixed`。

页面 placement 的完整默认值和 `LayoutPlan` 投影规则见 [布局系统的 LayoutPlan](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/08-layout-system.md#layoutplan)。下一步：[让业务容器承载子节点](/guide/learn/containers)。
