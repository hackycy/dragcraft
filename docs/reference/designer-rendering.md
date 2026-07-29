---
description: "通过 @dragcraft/designer 使用设计态渲染、节点交互、容器 region 和界面扩展。"
---

# 渲染与容器

Designer 聚合设计态画布需要的扩展 interface。它包含选中、拖拽、工具栏和空态，不是生产只读运行时。

先完成 [页面布局](/guide/learn/page-layout) 和 [业务容器](/guide/learn/containers)，再按这里的接口替换局部画布能力。

```ts
import {
  ContainerRegionOutlet,
  useContainerRuntime,
  useWidgetRuntime,
} from '@dragcraft/designer'
```

| 入口 | 用途 |
| --- | --- |
| `RendererExtensions` | 替换 Container Shell、空态、节点视觉和工具栏。 |
| `ContainerShellSource` | 静态 Vue Component 或宿主持有的 readonly component ref。 |
| `NodeActionDefinition` | 描述节点按钮或拖拽手柄。 |
| `RendererEventHooks` | 接收选择、拖拽和 hover 生命周期。 |
| `ContainerRegionOutlet` | 在业务容器 DOM 中渲染受控 region。 |
| `useContainerRuntime()` | 读取当前容器 variant、region 和节点。 |
| `useWidgetRuntime()` | 让业务物料通过受控命令更新当前节点的 props 与样式。 |
| `DcScrollArea` | 为自定义面板提供与工作台一致的滚动区域。 |

## Container Shell

```ts
const PreviewShell = defineComponent({
  setup(_, { slots }) {
    return () => h('main', { class: 'preview-shell' }, slots.default?.())
  },
})
```

`containerShell` 不接收布局 props，必须恰好渲染一次 default slot。Renderer 在 slot 中提供完整 Canvas Surface，并继续拥有 LayoutPlan 投影、滚动、surface style、selection planes、empty state 与 forbidden overlay。Shell 只负责外围视觉和 slot 位置，可以在祖先上设置 `--dc-safe-area-*` 集成变量。

传入 `computed(() => activeDefinition.value.containerShell)` 可以在现有 Designer 上响应式切换外壳。切换保留 Engine、Schema 和 history；Shell-local DOM/scroll 与 widget-local Vue state 不属于保留契约。

容器 region 的子节点由 Engine 拥有，不要把它们写入普通 `children`。Container Shell 与业务 container widget 是不同概念：前者包围整个 Canvas Surface，后者通过 `ContainerRegionOutlet` 组织 Schema 节点。
