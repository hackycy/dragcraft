---
description: "@dragcraft/themes、@dragcraft/i18n 与 @dragcraft/utils 的主题、国际化和纯函数公开 API。"
---

# themes、i18n 与 utils

`@dragcraft/themes` 提供工作台结构 CSS 与默认视觉，`@dragcraft/i18n` 提供响应式消息上下文，`@dragcraft/utils` 提供跨包纯函数。

```ts
import '@dragcraft/themes'
import { createI18n } from '@dragcraft/i18n'
import { generateShortId } from '@dragcraft/utils'
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `@dragcraft/themes`、`/standard`、`/material` | 加载结构 CSS 和完整工作台主题。 |
| `@dragcraft/themes/structure` | 完整自定义主题时加载必要结构层。 |
| `theme-contract.json` | 查找公开 token 与 component/part/state hook。 |
| `createI18n()`、`useI18n()` | 创建和读取 UI 消息上下文。 |
| `cloneDeep()`、`EventEmitter`、`generateShortId()` | 使用无 DOM 依赖的工具函数。 |

主题只控制工作台，不负责画布内业务组件的内容主题。常规定制优先覆盖 token；不要使用私有 `.dc-*` selector、`!important` 或零 specificity 技巧。

继续阅读 [主题、设备与国际化](/guide/customization/theme-device-and-i18n)。
