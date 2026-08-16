---
description: "理解 Designer Presentation、Schema 和生产运行时之间的展示边界。"
---

# 展示与空间策略

`DocumentSchema` 是纯 JSON 数据契约，保存 page、节点和结构 owner。它不包含页面空间、浏览器几何、滚动避让或叠放字段。节点的 `type` 是 Designer 和外部 Runtime 选择语义解释的唯一公共键。

Designer 的 `MaterialDefinition.presentation` 只声明 `visual` 或 `headless`。Visual Material 可以提供一个 Vue preview，并可选提供只包装完整 NodeHost 的 `PresentationFrame`。

`PresentationFrame`、`DesignerViewportPortal` 和 `useSurfaceReservation` 是受控的 Designer Presentation 扩展。Frame 只决定节点在 Application Surface 中的挂载和几何，不决定结构归属、顺序或 Schema 内容。

Container Material 使用 `DesignerRegionOutlet` 在业务 DOM 中挂载 region children。Region children 只按 Schema 的 owner 序列渲染一次，容器组件自行决定排列、滚动和响应式策略。

生产 Runtime 只读取 `DocumentSchema`、`type`、props 和结构关系。它可以按自己的平台组件和布局策略组织页面，但不能导入 Designer Presentation、Canvas Surface、Frame 或内部解析/几何类型。

生产运行时独立按 type 决定布局和平台组件。它读取 DocumentSchema，但不导入或复用 Designer 的 Presentation、Canvas Surface 或 Device Frame 交互。
