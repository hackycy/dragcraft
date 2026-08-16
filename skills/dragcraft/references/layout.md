# 页面空间策略

读取 [layout resources](resources/layout.json)，再确认 Designer Presentation 与宿主 Runtime 的布局边界。

## 实施

1. 用 `DocumentSchema.structure` 确认节点 owner 和 owner 内顺序。
2. 为 visual material 提供 preview；只有需要特殊挂载或几何时才提供 `PresentationFrame`。
3. 让 Container Material 通过 `DesignerRegionOutlet` 挂载 region children，空间样式由业务组件拥有。
4. 生产 Runtime 按稳定 `type` 实现自己的平台展示，不复用 Designer Presentation。

## 完成标准

测试覆盖 root/region 顺序、Frame 挂载、Device Frame 裁剪边界和未知物料恢复；Runtime 不导入设计态组件。
