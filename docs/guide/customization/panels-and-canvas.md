---
description: "替换工作台面板或画布局部部件，同时保留 Designer 和 Renderer 的交互所有权。"
---

# 面板与画布

标准工作台已经提供物料搜索、结构树、画布和属性面板。先判断你要替换的是局部视觉还是完整工作流：局部替换可以保留框架交互，完整替换则由宿主重新实现该面板的行为。

## 先替换单个物料项

活动页只改变物料卡片内部内容，仍把拖拽 shell 留给 Designer：

`src/editor/guide-extensions.ts`：

<<< ../../../examples/guide-project/src/editor/guide-extensions.ts

`materialItemRenderer` 接收已解析的展示数据和拖拽状态。它只返回内部内容；Designer 继续控制固定尺寸、overflow、防误拖和拖拽事件。

## 再选择完整替换范围

| 目标 | 建议入口 | 替换后宿主必须补齐 |
| --- | --- | --- |
| 改变单个物料卡片 | `materialItemRenderer` | 无，保留框架 shell |
| 替换物料栏 | `materialPanelRenderer` | 搜索、分组、物料创建流程 |
| 替换属性栏 | `propertyPanelRenderer` | 选中节点读取、字段值和命令提交 |
| 在两侧追加产品入口 | `leftRailRenderer`、`rightRailRenderer` | 产品按钮的状态与权限 |
| 改变空态、工具栏、选中视觉 | 对应 `rendererExtensions` 字段 | 组件 props 和 slot 契约 |

完整面板替换后，宿主需要自行读取 `engine.store.selectedNodeId` 或 `useDesigner()` 的状态，并把字段修改转换回命令。不要把私有 DOM 选择器当作面板 API。

## Container Shell 只能包住画布

`containerShell` 用于手机、桌面或产品预览外壳。它不接收 Renderer props，只需要恰好渲染一次 default slot。slot 中已经包含完整 Canvas Surface、flow/chrome/layer、滚动、选中平面和禁止层。

不要在 Shell 中读取 Schema、解释 `LayoutPlan`、创建业务节点或重建 selection/forbidden 层。业务分栏容器仍应使用 `ContainerRegionOutlet`；两者是不同扩展点。

**完成检查**：自定义物料卡片保持拖拽可用；替换的 Shell 只渲染一次 Canvas Surface，flow/chrome/layer、选中投影、禁止层与工具栏都没有消失。

下一步：[主题、设备与国际化](/guide/customization/theme-device-and-i18n)。公开字段见 [Designer 渲染与容器](/reference/designer-rendering)，Shell 的完整所有权边界见 [Architecture Map 的 Renderer 与 Container Shell](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/06-themes-and-device-frames.md#renderer-与-container-shell)。
