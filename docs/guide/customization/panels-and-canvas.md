---
description: "替换 Designer 面板、rail 和局部 Presentation，同时保留工作台交互。"
---

# 面板与画布

优先使用最小扩展点。局部替换能保留 Designer 管理的 selection、drag、history 和无障碍语义；完整替换面板时，宿主负责相应的全部交互。

| 目标 | 扩展点 | 宿主负责 |
| --- | --- | --- |
| 改变物料卡片内容 | `materialItemRenderer` | 卡片内容。 |
| 替换物料面板 | `materialPanelRenderer` | 搜索、分组、拖拽与空态。 |
| 替换属性面板 | `propertyPanelRenderer` | 选择读取、字段表单与 action 提交。 |
| 增加 rail 工具 | `leftRailRenderer`、`rightRailRenderer` | 产品入口与业务状态。 |
| 改变单个物料的设计态挂载 | `MaterialDefinition.presentation.frame` | 该 NodeHost 的 DOM、CSS 和几何。 |
| 改变设备外壳 | `DcDesigner.deviceFrame` | 当前 Device Frame definition、外观和安全区。 |

`materialItemRenderer` 只渲染内部内容。Designer 保留物料项的固定尺寸、拖拽、disabled 和 headless 标识。

Device Frame 必须恰好渲染一次 default slot。slot 已经包含完整 Canvas Surface；外壳不读取 Schema，不创建第二个业务 scrollport，也不重建 node tree。

`workspace` 管理宽屏 Dock 与窄屏抽屉。自定义面板使用 workspace controller 打开和关闭面板，不直接操作私有 DOM。
