# themes、i18n 与 utils

`@dragcraft/themes` 负责结构 CSS 聚合与默认工作台视觉，`@dragcraft/i18n` 提供 Vue UI 包共享的响应式国际化上下文，`@dragcraft/utils` 只保留跨包复用的纯函数。

先看一个最小示例：

```ts
import '@dragcraft/themes'
import { createI18n } from '@dragcraft/i18n'
import { EventEmitter, generateShortId } from '@dragcraft/utils'

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

这段代码说明三个包分别承担视觉、Vue 国际化上下文和纯函数职责。主题包的默认入口与 `/standard` 都加载必要结构 CSS、完整默认 token 和 Standard 基线配方，`/material` 在相同基线上加载 Material 差异；`/structure` 只提供高级主题所需的结构层。`/theme-contract.json` 和 `/css-custom-data.json` 分别提供机器契约与编辑器补全。i18n 包提供 `createI18n()`、`useI18n()` 与 `I18N_KEY`；utils 提供深拷贝、事件分发和短 id，不依赖 Vue 或 DOM。

`/standard`、`/material` 与 `/structure` 都是自包含 CSS 入口。使用者不需要再单独导入 designer、renderer 或 form-generator 的结构样式，也不会依赖 monorepo 内部路径。

视觉 recipe 只使用契约中的 `data-dc-component`、`data-dc-part`、`data-dc-state`，并使用普通 selector 与 CSS 导入顺序处理覆盖。官方主题禁止零 specificity 技巧、`!important` 和内部 `.dc-*` selector。具体写法与共享折叠 header 约束见[主题与设备框架](/guide/themes-and-device-frames#编写可覆盖的-recipe)。

如果你现在正在处理语言包合并，下一页更接近你的操作路径；Schema 的读写则在生命周期指南中说明。关于这一层，目前知道这些就够了。准备好之后，继续阅读 [编辑器国际化](/guide/i18n) 和 [Schema 生命周期](/guide/import-export-and-i18n)。
