# 页面空间策略

读取 [layout resources](resources/layout.json)，再确认 Designer Presentation、viewport plane 和宿主 Runtime 的布局边界。

## 实施

1. 用 `DocumentSchema.structure` 确认节点 owner 和 owner 内顺序；Schema 不保存浏览器几何、fixed/overlay 或 reservation。
2. 为 visual material 提供 preview；只有页面级 root material 需要特殊挂载或几何时才提供 `PresentationFrame`。
3. 固定边缘使用 `DesignerViewportPortal` 加 `useSurfaceReservation`，浮层只使用 Portal；Frame 不重复渲染 NodeHost。
4. 节点样式分别绑定到 `page.style.surface`、`node.style.container` 或 `node.style.content`，不要用 content style 代替 reservation。
5. 让 Container Material 通过 `DesignerRegionOutlet` 挂载 region children，空间样式由业务组件拥有。
6. 生产 Runtime 按稳定 `type` 实现自己的平台展示，不复用 Designer Presentation、Canvas Surface 或 Device Frame。

## 完成标准

测试覆盖 root/region 顺序、Frame/Portal 挂载、reservation resize、Device Frame 裁剪边界和未知物料恢复；Runtime 不导入设计态组件。
