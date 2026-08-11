---
description: "通过 @dragcraft/designer 使用设计态渲染、节点交互、容器 region 和界面扩展。"
---

# Presentation 与容器

Designer 聚合设计态画布需要的扩展 interface。它包含选中、拖拽、工具栏和空态，不是生产只读运行时。

```ts
import {
  ContainerRegionOutlet,
  useContainerRuntime,
  useWidgetRuntime,
} from '@dragcraft/designer'
```

| 入口 | 用途 |
| --- | --- |
| `RendererExtensions` | 配置 Designer Presentation 的 Container Shell、空态、节点视觉和工具栏。 |
| `ContainerShellSource` | 静态 Vue Component 或宿主持有的 readonly component ref。 |
| `NodeActionDefinition` | 描述节点按钮或拖拽手柄。 |
| `RendererEventHooks` | 接收选择、拖拽和 hover 生命周期。 |
| `ContainerRegionOutlet` | 在业务容器 DOM 中渲染受控 region。 |
| `useContainerRuntime()` | 读取当前容器 variant、region 和节点。 |
| `useWidgetRuntime()` | 让业务物料通过受控 `AuthoringAction` 更新当前节点的 props 与样式。 |
| `DcScrollArea` | 为自定义面板提供与工作台一致的滚动区域。 |

## Container Shell

```ts
const PreviewShell = defineComponent({
  setup(_, { slots }) {
    return () => h('main', { class: 'preview-shell' }, slots.default?.())
  },
})
```

`containerShell` 不接收布局 props，必须恰好渲染一次 default slot。Designer Presentation 在 slot 中提供完整 Canvas Surface，并继续拥有文档投影、滚动、surface style、selection planes、empty state 与 forbidden overlay。Shell 只负责外围视觉和 slot 位置，可以在祖先上设置 `--dc-safe-area-*` 集成变量。

未传入 `containerShell` 时，Designer 使用无设备元素的默认外壳：宽度固定为 `375px`，独立渲染时高度为 `667px`，最低高度为 `480px`。在 Designer 中，其高度随画布可用高度变化并保留上下各 `44px`；内容超出后在 Canvas Surface 内滚动，不会继续撑高外壳。Standard 主题将默认外壳呈现为直角、无边框、白色表面和轻投影。

传入 `computed(() => activeDefinition.value.containerShell)` 可以在现有 Designer 上响应式切换外壳。切换保留 document 和 history；Shell-local DOM/scroll 与 widget-local Vue state 不属于保留契约。

容器 region 的子节点由 `schema.structure.containers` 拥有，不要把它们写入节点对象。Container Shell 与业务 container widget 是不同概念：前者包围整个 Canvas Surface，后者通过 `ContainerRegionOutlet` 组织 Schema 节点。

页面级 `flow/chrome/layer` 的默认值、排序域、可见性和运行时映射见 [布局投影](/guide/fundamentals/layout-system)。业务容器的 region、迁移与插入几何见 [容器与 region](/guide/customization/layout-and-containers)。

`widgetFallback` 负责设计态未知物料，生产运行时必须提供自己的 fallback。不要在生产页面复用 `DcDesigner`、Designer Container Shell 或节点交互扩展。
