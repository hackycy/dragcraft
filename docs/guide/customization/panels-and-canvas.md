---
description: "替换物料卡片、面板、rail 和 Renderer 视觉部件，同时保留工作台交互语义。"
---

# 面板与画布

工作台扩展分为“保留框架外壳”和“完整替换部件”两类。优先替换最小范围，因为完整面板需要宿主重新实现搜索、分组、选中读取和字段提交。

## 从局部渲染开始

贯穿项目替换物料卡片内容和画布空态，同时保留 Designer 管理的拖拽外壳：

<<< ../../../examples/guide-project/src/editor/extensions.ts

`materialItemRenderer` 只渲染卡片内容。Designer 继续提供 draggable 状态、禁用判断、拖拽事件和物料语义，因此适合大多数品牌化物料列表。

## 选择扩展层级

| 目标 | 扩展点 | 需要宿主补齐 |
| --- | --- | --- |
| 改变单个物料卡片 | `materialItemRenderer` | 卡片内容 |
| 完整替换左侧物料面板 | `materialPanelRenderer` | 搜索、分组、拖拽和空态 |
| 完整替换右侧属性面板 | `propertyPanelRenderer` | 选中读取、表单和命令提交 |
| 在 rail 增加产品入口 | `leftRailRenderer`、`rightRailRenderer` | 按钮与业务状态 |
| 改变空态、工具栏或选择视觉 | `rendererExtensions` 对应字段 | 组件视觉和无障碍语义 |
| 改变整个设备外壳 | `containerShell` | 外围 DOM、设备 chrome 和 safe area |

Rail renderer 可以读取 Engine、workspace controller 和翻译函数。它适合打开素材库、页面设置或业务弹窗，不应在 rail 内复制物料面板和 Inspector。

## 保持 slot 契约

自定义 `nodeWrapper` 必须渲染 default slot，否则业务组件和交互层会消失。自定义 `containerShell` 不接收 LayoutPlan 或 Schema，并且必须恰好渲染一次 default slot。

该 slot 已经包含完整 Canvas Surface：

- flow、chrome 和 layer surface。
- 内容滚动、safe area 与 chrome inset。
- 节点 selection plane、工具栏和 forbidden overlay。
- root surface style、空态和 fallback。

Shell 可以在祖先设置 `--dc-safe-area-*` 集成变量，但不能重新解释节点、创建 scrollport 或重建选择层。

## 配置响应式工作台

`workspace` 控制布局尺寸和 compact 行为：

```ts
workspace: {
  compactBreakpoint: 1080,
  keyboardShortcuts: true,
}
```

宽屏使用左右 Dock，compact 模式使用互斥抽屉。自定义面板应通过 workspace controller 打开和关闭面板，不要直接修改私有 DOM。

## 验证替换结果

- 自定义物料卡片仍能拖入画布，并正确显示 disabled 状态。
- 自定义 wrapper 恰好渲染一次业务节点 slot。
- 切换 Shell 后 Engine、Schema 和 history 保持不变。
- flow/chrome/layer、禁止层、选中投影和工具栏没有丢失。
- 窄屏抽屉不会同时覆盖画布。

公开 props 和扩展接口见 [@dragcraft/designer](/reference/designer) 与 [渲染与容器](/reference/designer-rendering)。
