---
description: "通过 @dragcraft/designer 使用设计态渲染、节点交互、容器 region 和界面扩展。"
---

# 渲染与容器

Designer 聚合设计态画布需要的扩展接口。它包含选中、拖拽、工具栏和空态，不是生产只读运行时。

```ts
import {
  ContainerRegionOutlet,
  useContainerRuntime,
} from '@dragcraft/designer'
```

| 入口 | 用途 |
| --- | --- |
| `RendererExtensions` | 替换 shell、空态、节点视觉和工具栏。 |
| `NodeActionDefinition` | 描述节点按钮或拖拽手柄。 |
| `RendererEventHooks` | 接收选择、拖拽和 hover 生命周期。 |
| `ContainerRegionOutlet` | 在业务容器 DOM 中渲染受控 region。 |
| `useContainerRuntime()` | 读取当前容器 variant、region 和节点。 |
| `DcScrollArea` | 为自定义面板提供与工作台一致的滚动区域。 |

`containerShell` 只能消费已经按布局计划分好的 VNode，不能重新读取 Schema 或创建业务节点。容器 region 的子节点由 Engine 拥有，不要把它们写入普通 `children`。
