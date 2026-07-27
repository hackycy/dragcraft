---
description: "替换物料栏、属性栏、rail 和 Renderer 的局部视觉部件，同时保留框架交互语义。"
---

# 面板与画布

当标准工作台不符合产品界面时，先只改变物料卡片内容，替换 `materialItemRenderer`。示例保留 Designer 管理的拖拽外壳，只渲染自己的卡片内容：

<<< ../../../examples/guide-project/src/editor/create-page-designer.ts#tutorial-renderer-extensions

`DesignerExtensions` 可以替换完整物料面板、属性面板或追加 rail 内容。`RendererExtensions` 可以替换空态、工具栏、节点包裹层、选中视觉和 `containerShell`。

| 目标 | 建议入口 |
| --- | --- |
| 改变单个物料卡片 | `materialItemRenderer` |
| 完整替换物料或属性面板 | `materialPanelRenderer`、`propertyPanelRenderer` |
| 在两侧增加产品入口 | `leftRailRenderer`、`rightRailRenderer` |
| 改变画布空态、工具栏或选择视觉 | 对应 `rendererExtensions` 字段 |

| 框架负责 | 宿主负责 |
| --- | --- |
| 拖拽外壳、选择投影、面板上下文与 Renderer VNode 分区 | 搜索、分组、产品操作、面板布局和自定义视觉 |

完整面板替换后，宿主需要自行实现搜索、分组、选中节点读取和字段提交。自定义 `nodeWrapper` 必须渲染 default slot；自定义 `containerShell` 必须渲染 Renderer 提供的分区 VNode，并注册需要的选择平面。

不要用私有 DOM class 覆盖交互，也不要重新读取 Schema 来重建 `containerShell` 的内容。

**完成检查**：自定义物料卡片保持拖拽可用；替换的 shell 仍渲染每个分区 VNode，选中投影与工具栏没有消失。

下一步：[主题、设备与国际化](/guide/customization/theme-device-and-i18n)；公开 props 和扩展字段见 [@dragcraft/designer](/reference/designer) 与 [@dragcraft/renderer](/reference/renderer)。
