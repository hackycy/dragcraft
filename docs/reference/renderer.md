---
description: "@dragcraft/renderer 的设计态画布、节点交互、选择投影和容器 region 公开 API。"
---

# @dragcraft/renderer

Renderer 把 Schema 节点渲染到设计器画布。它包含选中、拖拽、工具栏和空态，因此不是生产只读运行时。

```ts
import { ContainerRegionOutlet, RootRenderer } from '@dragcraft/renderer'
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `RootRenderer` | 直接组合 Renderer 时的设计态根组件。 |
| `RendererExtensions` | 替换 shell、空态、节点视觉和工具栏。 |
| `NodeActionDefinition` | 描述节点按钮或拖拽手柄。 |
| `RendererEventHooks` | 接收选择、拖拽和 hover 生命周期。 |
| `ContainerRegionOutlet` | 在业务容器 DOM 中渲染受控 region。 |
| `useContainerRuntime()` | 读取当前容器 variant、region 和节点。 |

`containerShell` 收到的是已经按 `LayoutPlan` 分好的 VNode，不能重新读取 Schema 或重新创建业务节点。自定义选择视觉只绘制投影，不能改变 Renderer 管理的坐标平面和裁剪。

容器 region 的子节点由 Core 拥有。不要在业务容器里手动调用 `WidgetRenderer`，也不要把 region 子节点写进普通 `children`。

继续阅读 [页面布局与容器](/guide/customization/layout-and-containers) 或 [面板与画布](/guide/customization/panels-and-canvas)。
