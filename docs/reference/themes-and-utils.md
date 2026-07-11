# themes 与 utils

`@dragcraft/themes` 负责默认视觉皮肤，`@dragcraft/utils` 负责跨包复用的纯函数。

先看一个最小示例：

```ts
import '@dragcraft/themes/shadcn'
import { createI18n, EventEmitter, generateShortId } from '@dragcraft/utils'

const i18n = createI18n('zh-CN', {
  'zh-CN': {
    designer: {
      title: '设计器',
    },
  },
})

const events = new EventEmitter()
const nodeId = generateShortId()
```

这段代码说明这两个包并不承担同一种职责。主题包只负责样式入口；默认入口与 `/shadcn` 都加载 shadcn 皮肤，`/material` 加载 Google Material 3。utils 则提供可以在多个包之间复用的基础能力，比如 i18n、事件分发和短 id。

如果你现在正在处理语言包合并，下一页更接近你的操作路径；Schema 的读写则在生命周期指南中说明。关于这一层，目前知道这些就够了。准备好之后，继续阅读 [编辑器国际化](/guide/i18n) 和 [Schema 生命周期](/guide/import-export-and-i18n)。
