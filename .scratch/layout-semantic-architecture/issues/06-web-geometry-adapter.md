# Vue 与浏览器展示适配器

Status: resolved
Type: grilling
Blocked by: 02, 03, 05, 10
Superseded in part by: 12 (`MaterialPreviewContext.invokeAction()` only)

## Question

定义 Web Designer Presentation Adapter 如何消费 `ResolvedDocument` 与消费端展示策略，为 navigation、floating action、bottom bar、dialog 和普通内容完成 Vue/DOM 预览、选中、拖放、滚动、测量与 CSS；明确展示几何如何独立于 Schema、框架使用者可以替换哪些 adapter，以及 Renderer、Canvas、Device Frame 和物料预览之间的 seam。

## Answer

第一版不公开整页 `MiniProgramSurfaceAdapter` 或通用 Surface Adapter。Dragcraft 的常见形态就是应用页面设计画布，目前只有一个真实实现；因此 Renderer 内部提供单一深 module `ApplicationSurface`，框架使用者只注册 `MaterialDefinition[]`。未来只有出现第二个无法由当前体系表达的真实画布实现时，才提取可替换 seam。

整体层级固定为：

```text
Designer Canvas Workspace
    └── Renderer Frame Boundary
          ├── Device Frame / ContainerShell
          │     └── ApplicationSurface
          │           ├── Document Plane
          │           └── Viewport Plane
          │
          └── Interaction Plane
                ├── selection
                ├── toolbar
                ├── drop feedback
                └── diagnostics
```

Canvas Workspace 保留现有居中、pan、缩放和 stage 尺寸行为。Renderer Frame Boundary 是每个 Designer 实例的稳定坐标与 portal owner。Device Frame/ContainerShell 是实际存在的 slot-only seam，只能恰好渲染一次 ApplicationSurface slot，并提供设备外观、业务 viewport、裁剪与登记的 logical safe-area CSS 变量；它不接收 Schema、`ResolvedDocument`、NodeHost、material、reservation、selection 或任何布局计划。切换 Frame 保留 Schema、Authoring Engine 和 history，Shell DOM 与 preview-local Vue state 不保证保留。

ApplicationSurface 是框架拥有的唯一应用预览表面。它按 `ResolvedDocument.root` 的真实结构顺序为每个 root node 创建一次 PresentationFrame/NodeHost，不按 type 预设 navbar、bottom bar、FAB 或 dialog 区域，也不生成新的 LayoutPlan。

Visual Material 的 `designer.presentation` 可选提供 `frame`；普通物料省略 frame，直接进入默认文档流：

```ts
type DesignerPresentation =
  | {
      kind: 'visual'
      preview: VueComponent
      frame?: VueComponent
    }
  | { kind: 'headless' }
```

Material Preview 只渲染物料自身内容；PresentationFrame 只控制完整 NodeHost slot 的设计态 Vue/DOM 包装、挂载与几何。Frame 必须恰好渲染一次 slot，不能自行查询或渲染其他 Schema 节点、修改 owner/顺序或写入 Schema。navbar、FAB、bottom bar、dialog 可以分别使用 app-owned sticky、floating、edge 或 overlay Frame，但 Schema 和 MaterialDefinition 都不出现 `flow/chrome/layer` 或固定 placement 分类。

ApplicationSurface 只暴露两个业务节点挂载关系：

- Document Plane 位于唯一内容 scrollport，普通与 sticky Frame 随内容滚动关系工作。
- Viewport Plane 相对当前应用 viewport 定位且受 Device Frame 裁剪，特殊 Frame 通过 `DesignerViewportPortal` 移动完整 NodeHost；它使用 surface-relative absolute positioning，不使用浏览器 window fixed 或 body portal。

Interaction Plane 由 Designer 私有，在 DOM 上是 Device Frame 的 sibling、在逻辑上由当前 Surface 几何驱动。这样业务 preview 受设备圆角与 viewport 裁剪，贴边节点的 selection 和 toolbar 却可以越过边框显示。Material/Frame 不得挂载到 Interaction Plane。Viewport Portal 只接受 root-owned NodeHost；region child 尝试 portal 时产生 presentation diagnostic 并回退在原 region 渲染。

固定边缘 Frame 如需让内容和滚动条避让，使用 Designer-only `SurfaceReservation`，不声明持久化 reserve/inset：

```ts
const reservation = useSurfaceReservation(elementRef, {
  edge: 'block-start',
  fallbackSize: 44,
})
```

ApplicationSurface 使用 `ResizeObserver` 测量实际尺寸，按 root 结构顺序稳定叠加同一 logical edge 的贡献，并合并 Device Frame safe area，返回 Frame offset 后调整 scrollport 的真实边界。覆盖式 navbar、FAB 和 dialog 不注册 reservation；sticky navbar 留在 Document Plane。尺寸、窗口和 preview context 变化只重算 Designer 几何，不触发 Schema 解析或 history。

`NodeHost` 是每个 Schema 节点唯一的设计态 DOM、几何和交互实体：

```text
PresentationFrame
    └── NodeHost                 Designer-owned
          └── Material Preview  user-owned
```

NodeHost 持有 nodeId/owner，承载 hover、selection、drag、节点外层 style、visual preview、headless proxy 或 unknown fallback，并向 Surface Geometry Registry 注册唯一 HTMLElement。Material Preview 不能把主要内容 Teleport 到 NodeHost 外，也不注册自己的选区 DOM。Frame 的背景或 dialog mask 位于 NodeHost 外，默认不进入节点选区。

Geometry Registry 按 nodeId 管理 element，集中使用 ResizeObserver、scroll/resize 信号和 requestAnimationFrame 批量测量，把 `getBoundingClientRect()` 转换为 Renderer Frame Boundary 坐标。Interaction Plane 依据同一矩形绘制 selection、toolbar 和 drop feedback；Document/Viewport、Device Frame 尺寸与多 Designer 实例不产生不同测量协议，也不使用全局 DOM selector 或 body portal。

Root 拖放直接从 NodeHost 几何产生结构锚点：指针位于 block midpoint 前后分别得到 `before(nodeId)` / `after(nodeId)`，空白区域得到 `end`。插入指示器画在 Interaction Plane，drop 后把 `StructuralDestination` 交给 Authoring Engine；Schema Editor 再根据真实 owner 序列解析 index。删除 `sortScope`、视觉 order 与视觉 index 回写数组的映射。

Container Preview 通过 `DesignerRegionOutlet` 放置每个稳定 region：

```ts
h(DesignerRegionOutlet, {
  regionId: 'content',
  resolveDropAnchor: optionalGeometryResolver,
})
```

Outlet 从当前 Container NodeHost context 和 `ResolvedDocument.containersById` 读取 child，按真实 region 顺序创建 NodeHost，并拥有空态、拖放目标和诊断。普通纵向 region 使用默认 midpoint resolver；横向、grid 或异形 region 可在 Designer material 配置中提供纯浏览器 `resolveDropAnchor`。Resolver 只返回 start/end/before/after，不裁决 type、cardinality 或权限。

Visual Container 必须为每个声明 region 恰好挂载一个 Outlet；未知、重复或缺失 Outlet 是 presentation 配置错误。Designer 显示诊断，并把未成功挂载的 region children 放入框架 recovery 区域，禁止静默丢失。Headless Container 由标准 proxy 自动创建全部 Outlet；Unknown Container 按 Schema 保存的 region key 显示只读 recovery regions。递归容器仍由 Schema Editor 禁止。

Material Preview 不接触 Engine、Registry、可写 Store、history 或全局 DOM。框架提供受控 `MaterialPreviewContext`，只包含只读 current node、page、globalConfig、owner、selected/hovered/dragging，以及经 Authoring Engine 执行的 `updateSelf()` 与 `invokeAction()`。Dragcraft 不提供 `previewState` 或场景模拟 interface；额外展示状态由框架使用者在自己的 Vue Preview 与宿主状态体系中自行实现，且不进入 Schema/history。Preview 也不能通过框架 context 隐式遍历完整文档。

CSS 所有权保持现有 `structure.css + standard.css` 分层：structure.css 固定 plane、scrollport、portal、NodeHost 与 Interaction Plane 必要几何；standard.css 提供默认 Designer 视觉；Material Preview/PresentationFrame 拥有业务 CSS；Device Frame 拥有设备外观。ApplicationSurface 建立不可突破的 stacking contexts，Document 低于 Viewport，Interaction 高于两者；Viewport 内业务 z-index 由 Frame 决定但不能覆盖 Designer 交互。

跨 seam 只公开已登记的 safe-area integration variables、Designer theme tokens 与精选 `data-dc-component` / `data-dc-state` hooks。`.dc-*` classes、plane DOM、reservation 累加变量、Geometry Registry 属性与 z-index 数值均为 implementation。由此删除旧 `LayoutPlan`、`NodeLayout`、page regions、chrome/layer VNode 分发、sort scope、inset plan 和共享空间 CSS 协议，同时保留现有 toolbar、selection、drag/drop、Device Frame 与主题交互体验。
