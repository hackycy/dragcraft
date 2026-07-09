# 主题与设备框架

这一页会解释什么时候直接导入主题，什么时候再接入设备外壳。

先看最常见的两行导入：

```ts
import '@dragcraft/themes/antd'
import '@dragcraft/device-frames/styles'
```

`@dragcraft/themes` 提供的是设计器和画布相关的默认视觉皮肤。`@dragcraft/device-frames` 提供的是手机、平板、桌面这类设备外壳。

## 什么时候只用主题

如果你只是想让设计器有一套可用样式，只导入 `@dragcraft/themes` 就够了。

主题包不会改动组件逻辑，它只覆盖稳定的 `dc-*` class 和 CSS 变量。

## 什么时候再接设备框架

如果你想让画布以 iPhone、Android、Tablet 或 Desktop 的形式预览，再接 `DeviceFrameShell`。

```ts
import { createDesigner } from '@dragcraft/designer'
import {
  createDeviceFrameContext,
  createDeviceToolbarRenderer,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
} from '@dragcraft/device-frames'
import { provide } from 'vue'

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })
provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)

const designer = createDesigner({
  extensions: {
    rendererExtensions: {
      containerShell: DeviceFrameShell,
    },
    toolbarRenderer: createDeviceToolbarRenderer(deviceCtx),
  },
})
```

关于视觉层和设备外壳的边界，目前知道这些就够了。准备好之后，继续阅读 [导入导出与国际化](/guide/import-export-and-i18n)。
