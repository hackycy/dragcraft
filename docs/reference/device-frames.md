---
description: "@dragcraft/device-frames 的设备上下文、设备选择器、Frame Shell 和选中平面公开 API。"
---

# @dragcraft/device-frames

设备 Frame 为编辑画布提供可替换外壳。宿主控制当前设备和设备选择器的位置。

```ts
import {
  createDeviceFrameContext,
  DeviceFrameShell,
  DevicePicker,
} from '@dragcraft/device-frames'

const context = createDeviceFrameContext({ initialDevice: 'iphone' })
```

需要适配高度较小的工作区时，在创建 context 前复制并覆盖对应 preset。这里的 `height` 是业务内容 viewport 高度，设备状态栏、底部系统导航和桌面标题栏不计入其中：

```ts
import {
  createDeviceFrameContext,
  getDefaultPresets,
} from '@dragcraft/device-frames'

const presets = getDefaultPresets().map(preset =>
  preset.type === 'iphone'
    ? { ...preset, height: 600 }
    : preset,
)

const context = createDeviceFrameContext({
  initialDevice: 'iphone',
  presets,
})
```

`presets` 会完整替换默认列表，并在 context 创建时被校验和浅拷贝。`width`、`height` 必须是有限且大于零的数字；创建完成后再修改传入对象不会改变 viewport。

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `createDeviceFrameContext()` | 创建当前设备和预设集合。 |
| `DEVICE_FRAME_CONTEXT_KEY` | 向 Frame Shell 和选择器提供上下文。 |
| `DeviceFrameShell` | 作为 `rendererExtensions.containerShell` 使用。 |
| `DevicePicker` | 宿主渲染的设备选择控件。 |
| `DevicePreset` | 定义或替换设备预设；宽高会传给对应 Frame。 |

Frame 必须注册 root、content 和 viewport 选择平面。预设的宽高描述可用 viewport，不能通过外框 padding 或 border 移动物料坐标。

自定义 `frameComponent` 会收到 `viewportWidth` 和 `viewportHeight` 数值 props，应分别用于 Frame 根宽度和业务 viewport 高度。直接使用包内 Frame 且不传尺寸时，仍使用对应机型的默认 CSS 尺寸。

设备 Frame 不负责业务页面运行时，也不提供宿主导航栏。继续阅读 [主题、设备与国际化](/guide/customization/theme-device-and-i18n)。
