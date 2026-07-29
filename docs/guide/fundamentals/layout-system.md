---
description: "理解 flow、chrome、layer、排序域、可见性和生产运行时布局投影。"
---

# 布局投影

布局系统把 `root.children` 投影到内容流、页面 chrome 和浮层，并保证每个 root 节点只渲染一次。它表达页面意图，不替业务物料定义 flex 或 grid 几何。

## 先看三种结果

贯穿项目同时注册了普通公告、固定页头和浮动操作。浮动操作的完整定义如下：

<<< ../../../examples/guide-project/src/domain/widgets/floating-action.ts

`defaultLayout` 让新建的浮动操作默认进入 `layer`。初始 Schema 仍显式保存实例 layout，使页面数据不依赖创建过程。

| placement | 默认 surface | 排序行为 |
| --- | --- | --- |
| `flow` | `content` region | 默认进入 `content` sort scope |
| `chrome` | 指定页面边缘 | 默认不参与正文排序 |
| `layer` | `float` layer | 默认不参与正文排序 |

未声明 layout 的节点按 `flow/content` 处理。非 `content` flow region 默认不参与排序，除非显式声明自己的 `sortScope`。

## 固定页面 chrome

固定页头通过 `reserve` 告诉画布内容应避让多少空间：

```ts
layout: {
  placement: {
    kind: 'chrome',
    edge: 'block-start',
    position: 'fixed',
    reserve: { mode: 'size', size: 48 },
    avoidContent: true,
  },
}
```

`position` 可以是 `fixed`、`sticky` 或 `flow`。`reserve.mode` 的选择标准如下：

- 尺寸固定且跨端一致时使用 `size`。
- Web 设计态需要读取实际 DOM 尺寸时使用 `measure`，并可提供首帧 fallback size。
- chrome 允许覆盖正文时使用 `none` 或 `avoidContent: false`。

Device Frame 的系统状态栏与 Schema chrome 是两层结构。前者包围整个 Canvas Surface，后者属于业务页面。

## 定位浮层

`framework` mode 适合按 anchor 和 offset 定位的按钮、角标和提示。`self` mode 给物料完整 layer 坐标系，适合复杂吸附或多个浮层协同。

设计态和示例运行时都会把安全区与 chrome inset 保留给 layer。业务组件不能通过提高工作台 z-index 把自己移出页面坐标系。

## 控制顺序和可见性

`layout.order` 改变同一 surface 中的视觉顺序，不改变节点所有权。`visible` 可以是布尔值或读取只读 Schema 的 predicate。

设计态仍会绘制不可见节点的半透明轮廓，方便选中和恢复；生产运行时应跳过该节点。predicate 必须是确定性的，不能在读取过程中修改 Schema 或发出网络请求。

## 在生产运行时重建投影

Vue 参考运行时独立解析注册表默认值、实例覆盖、可见性、顺序和固定 inset：

<<< ../../../examples/guide-project/src/runtime/layout.ts

这份代码没有导入内部 `createLayoutPlan()`。生产运行时需要为目标平台维护自己的投影，并对支持的 placement、样式 DSL 和 fallback 策略负责。

> [!IMPORTANT]
> 页面 layout 只作用于 `root.children`。容器 region 中的子节点由容器组件排列，不再进入页面 `flow/chrome/layer` 投影。

需要让组件拥有子节点时，继续阅读 [容器与 region](/guide/customization/layout-and-containers)。内部投影规则可查阅 [布局系统 Architecture Map](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/08-layout-system.md)。
