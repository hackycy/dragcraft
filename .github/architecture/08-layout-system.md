# 页面 Presentation 边界

`DocumentSchema` 只保存节点、唯一 owner 和 owner 内顺序。Designer 按 owner 序列为每个节点建立一个 NodeHost；Schema 不声明节点如何占据空间、参与滚动或形成叠放关系。

## 规则

- Visual Material 通过 `presentation` 提供预览，可选提供只包装完整 NodeHost 的 `PresentationFrame`。
- Container Material 通过 `DesignerRegionOutlet` 在自己的 DOM 中挂载 region children；容器组件拥有其空间策略。
- `PresentationFrame`、viewport mount、reservation 和几何测量属于 Designer 内部实现；Frame 不写 Schema，也不改变 owner 或顺序。
- Presentation 内部以 NodeHost 作为设计态命中、mask 和布局几何来源。普通文档流 Preview 的 `style.content.margin` 属于 NodeHost 的内部布局 footprint；`style.container.margin` 保持为 NodeHost 外部间距。root-owned selection 是独立的 `root-segment` 视觉范围：横向覆盖 root plane，纵向使用 NodeHost 实际高度，并在 NodeHost 外侧和 Frame 边框带绘制 edge；container-owned selection 则严格跟随 NodeHost。viewport Preview 由 Frame 提供 containing block，内部 Preview surface 与 NodeHost anchor 分离，anchor 持续对齐 surface 的实际矩形，且不接收 `style.container.margin`；Frame 与 Preview 负责 viewport 内的定位和间距。viewport mount 只作用于 Frame 的 root NodeHost，Region children 保持在容器 Preview 的 DOM 内。Frame 不得通过 CSS 将 NodeHost 扩张成全屏 containing block 或透明覆盖层。
- Device Frame 只包围一次 Application Surface；设备外壳不能读取 Schema、创建节点或拥有 Designer 交互。
- 生产 Runtime 按稳定 `type` 解释纯数据 Schema，并自行选择组件、滚动、边缘控件和叠放策略。

## 容器

容器的 region 和容量由 material schema 声明，children 顺序由 `schema.structure.containers` 保存。业务组件通过 `DesignerRegionOutlet` 将 region 放入自己的 DOM，因此框架不会定义 flex、grid、插入方向或轨道。

## 几何边界

Canvas Surface 是业务 preview 的唯一滚动和裁剪边界。Container Shell 只能渲染一次默认 slot，不能创建第二个业务 scrollport，也不能重建页面 node tree。Device Frame 只包围该 preview，Designer Presentation 在其外部维持工作台交互。
