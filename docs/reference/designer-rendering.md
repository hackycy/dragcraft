---
description: "通过 @dragcraft/designer 使用设计态渲染、节点交互、容器 region 和界面扩展。"
---

# Presentation 与容器

Designer 聚合设计态画布需要的扩展 interface。它包含选中、拖拽、工具栏和空态，不是生产只读运行时。

```ts
import { DesignerRegionOutlet, useContainerRuntime } from '@dragcraft/designer'
```

| 入口 | 用途 |
| --- | --- |
| `DesignerDeviceFrame` | 宿主持有的只读设备外壳定义，通过 `DcDesigner.deviceFrame` 接入。 |
| `NodeActionDefinition` | 描述节点按钮或拖拽手柄。 |
| `DesignerRegionOutlet` | 在业务容器 DOM 中渲染受控 region。 |
| `useContainerRuntime()` | 读取当前容器 variant、region 和节点。 |
| `DcScrollArea` | 为自定义面板提供与工作台一致的滚动区域。 |

`DesignerRegionOutlet` 的最小调用是：

```vue
<DesignerRegionOutlet
  region-id="content"
  :resolve-drop-index="resolveVerticalDropIndex"
  aria-label="内容"
/>
```

`resolveDropIndex` 接收 `event`、region 元素、当前直接子元素和只读节点列表，并返回 `0..nodes.length` 的整数；返回 `null` 表示当前拖放没有目标。容器组件负责计算几何，Designer 负责把结果转换成结构 action。一个 region 只能有一个 primary outlet，重复 outlet 会显示诊断恢复态。

## Device Frame

```ts
const PreviewShell = defineComponent({
  setup(_, { slots }) {
    return () => h('main', { class: 'preview-shell' }, slots.default?.())
  },
})
```

Device Frame 不接收布局 props，必须恰好渲染一次 default slot。Designer Presentation 在 slot 中提供完整 Canvas Surface，并继续拥有文档投影、滚动、surface style、selection planes、empty state 与 forbidden overlay。外壳只负责设备视觉和 slot 位置，可以在祖先上设置 `--dc-safe-area-*` 集成变量。

将当前 definition 直接传给工作台：

```vue
<DcDesigner :instance="designer" :device-frame="activeDefinition" />
```

切换设备只更新展示投影，并保留 document、selection 和 history；外壳本地 DOM、scroll 与 preview-local Vue state 不属于保留契约。

容器 region 的子节点由 `schema.structure.containers` 拥有，不要把它们写入节点对象。Device Frame 与业务 container widget 是不同概念：前者包围整个 Canvas Surface，后者通过 `DesignerRegionOutlet` 组织 Schema 节点。

页面空间策略不属于 Designer 公共 Schema 或 MaterialDefinition 协议。生产 Runtime 按稳定 `type` 自主解释展示；业务容器的 region、迁移与插入几何见 [容器与 region](/guide/customization/layout-and-containers)。

未知物料由 Designer 的只读 fallback 呈现，生产运行时必须提供自己的 fallback。不要在生产页面复用 `DcDesigner`、Device Frame 或节点交互实现。
