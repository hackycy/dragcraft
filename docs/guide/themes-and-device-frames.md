# 主题与设备框架

dragcraft 的 UI 包只输出稳定的 `dc-*` class。你可以直接导入一套皮肤，也可以让业务 CSS 完全接管视觉。

先使用内置主题：

```ts
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/themes/antd'
```

这会为设计器、画布、物料栏和属性表单加载 Ant Design 风格的默认样式。使用 Material 风格时改为导入 `@dragcraft/themes/material`。

## 覆盖主题而不改组件逻辑

主题通过 CSS variables 和语义化 class 组织，因此业务样式可以在主题之后覆盖：

```css
/* app.css，在主题入口之后导入 */
.dc-designer {
  --dc-primary: #0f766e;
  --dc-bg: #ffffff;
}

.dc-material-item {
  border-radius: 4px;
}
```

覆盖变量适合改品牌色、间距和表面颜色；覆盖 `dc-*` class 适合调整局部组件结构。若要完全无头集成，不导入 `@dragcraft/themes`，而是为需要的 class 编写完整样式。

## 在画布中接入设备预览

设备框架是 renderer 的 `containerShell` 扩展，不属于业务物料：

```ts
import '@dragcraft/device-frames/styles'
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
  widgetMetas,
  componentMap,
  extensions: {
    rendererExtensions: { containerShell: DeviceFrameShell },
    toolbarRenderer: createDeviceToolbarRenderer(deviceCtx),
  },
})
```

`DeviceFrameShell` 接收 renderer 已经分好的内容流、chrome 和浮层节点。它不重新解释 Schema，因此 iPhone、平板和桌面预览可以替换，而不改变页面数据。

关于视觉层，目前知道这些就够了。准备好之后，继续阅读 [编辑器国际化](/guide/i18n)。
