# 页面空间策略

读取 [layout resources](resources/layout.json)，再确认 Designer Presentation、viewport plane 和宿主 Runtime 的布局边界。

## 几何契约

- NodeHost 是 Designer 的实际布局、命中和 mask 几何。root-owned 节点的 selection 是独立且不可命中的 root-plane 视觉段：它横向覆盖 root plane，但只跟随 NodeHost 的纵向范围；container-owned selection 则贴合 NodeHost。不要用 root selection 的全宽外观推断点击范围。
- 普通文档流中，`style.content.margin` 是 NodeHost 的内部 layout footprint，会被 NodeHost、mask 和命中覆盖；`style.container.margin` 是 NodeHost 外部间距，不计入其几何。
- viewport Frame 只提供 Preview 的定位上下文。Designer 会使 NodeHost anchor 跟随实际 Preview surface；Frame 可以是全屏定位层，但不得通过 CSS 把 NodeHost 扩张成 viewport 大小的透明层。viewport 内的位置、尺寸和间距由 Frame 或 Preview 根元素表达，`style.container.margin` 不进入 anchor。
- viewport mount 只处理使用 Frame 的 root NodeHost。Container 的 Region child 仍由 `DesignerRegionOutlet` 保留在 container Preview DOM 中，不重复 Portal 或 Teleport。

## 实施

1. 用 `DocumentSchema.structure` 确认节点 owner 和 owner 内顺序；Schema 不保存浏览器几何、fixed/overlay 或 reservation。
2. 为 visual material 提供 preview；只有页面级 root material 需要特殊挂载或几何时才提供 `PresentationFrame`。
3. 固定边缘使用 `DesignerViewportPortal` 加 `useSurfaceReservation`，浮层只使用 Portal；Frame 只包装完整 NodeHost，不重复渲染它，也不以内部 NodeHost 作为全屏 containing block。
4. 节点样式分别绑定到 `page.style.surface`、`node.style.container` 或 `node.style.content`；普通流的 content margin 与 container margin 遵循上面的几何契约，不要用 content style 代替 reservation。
5. 让 Container Material 通过 `DesignerRegionOutlet` 挂载 region children，空间样式由业务组件拥有。
6. 生产 Runtime 按稳定 `type` 实现自己的平台展示，不复用 Designer Presentation、Canvas Surface 或 Device Frame。

## 完成标准

测试验证实际 NodeHost/Preview rect、margin 留白点击命中，以及 root-segment 与 container selection 的不同范围；viewport 节点在 resize、滚动和 reservation 更新后仍对齐实际 Preview，且 framed container 的 Region child 不会重复挂载。继续覆盖 root/region 顺序、Device Frame 裁剪边界和未知物料恢复；Runtime 不导入设计态组件。
