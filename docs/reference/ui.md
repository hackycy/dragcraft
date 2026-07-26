---
description: "@dragcraft/ui 的共享 Vue UI 模块与 ScrollArea 使用参考。"
---

# @dragcraft/ui

`@dragcraft/ui` 提供 designer、device-frames 和宿主扩展共同使用的基础 Vue UI 模块。当前公开模块是纵向 `DcScrollArea`，它保留浏览器原生滚动，只用覆盖层绘制统一滚动条，因此内容宽度不会因为滚动条出现而变化。

```ts
import { DcScrollArea } from '@dragcraft/ui'
import '@dragcraft/ui/styles'
```

在已经导入 `@dragcraft/themes` 的工作台中，不需要再次导入 UI 样式；主题入口已经包含 ScrollArea 的结构、默认 token 和视觉 recipe。单独使用 `@dragcraft/ui` 时导入 `/styles` 即可。

## DcScrollArea

```ts
import { h } from 'vue'
import { DcScrollArea } from '@dragcraft/ui'

h(DcScrollArea, {
  type: 'hover',
  scrollHideDelay: 600,
  onScroll: event => console.log(event),
}, {
  default: () => h('div', longContent),
})
```

`type` 支持以下策略：

- `hover`：内容溢出时，在 hover、滚动或拖动期间显示，默认值。
- `scroll`：仅在滚动或拖动期间显示。
- `auto`：只要内容溢出就显示。
- `always`：始终保持 scrollbar 可见；无溢出时不绘制 thumb。

组件只支持纵向滚动。滚轮、触摸、键盘和代码设置 `scrollTop` 仍由原生 viewport 处理；thumb 拖动与轨道点击只同步原生 `scrollTop`，不会对内容应用位移 transform。

## 样式入口

| 入口 | 内容 |
| --- | --- |
| `@dragcraft/ui/styles` | 结构与默认视觉 recipe |
| `@dragcraft/ui/structure.css` | viewport、覆盖层轨道和交互几何 |
| `@dragcraft/ui/recipe.css` | thumb 颜色、圆角和状态过渡 |

公开主题 hook 为 `data-dc-component="scroll-area"`，parts 包括 `viewport`、`content`、`scrollbar`、`thumb`，states 包括 `overflowing`、`visible`、`hidden`、`scrolling`、`dragging`。业务主题优先覆盖 `--dc-scroll-area-*` token，不应依赖内部 `.dc-scroll-area__*` class。
