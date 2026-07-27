---
description: "@dragcraft/designer 的 Standard 主题、结构层、主题契约与国际化入口。"
---

# 样式与国际化

Designer 只提供一套完整 Standard 工作台主题：

```ts
import '@dragcraft/designer/styles'
import { createI18n, useI18n } from '@dragcraft/designer'
```

| 入口 | 用途 |
| --- | --- |
| `@dragcraft/designer/styles` | 加载结构 CSS、Standard token 和完整视觉 recipe。 |
| `@dragcraft/designer/styles/structure` | 完全自定义视觉时只加载必要结构层。 |
| `@dragcraft/designer/theme-contract.json` | 查找公开 token 与 component/part/state hook。 |
| `@dragcraft/designer/css-custom-data.json` | 为 CSS 编辑器提供公开自定义属性数据。 |
| `createI18n()`、`useI18n()` | 创建和读取工作台消息上下文。 |

主题只控制工作台，不负责画布内业务物料。常规品牌定制优先覆盖 token；只有 token 无法表达时才使用公开 data hook。不要依赖私有 `.dc-*` selector、`!important` 或零 specificity 技巧。
