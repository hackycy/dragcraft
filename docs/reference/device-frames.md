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

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `createDeviceFrameContext()` | 创建当前设备和预设集合。 |
| `DEVICE_FRAME_CONTEXT_KEY` | 向 Frame Shell 和选择器提供上下文。 |
| `DeviceFrameShell` | 作为 `rendererExtensions.containerShell` 使用。 |
| `DevicePicker` | 宿主渲染的设备选择控件。 |
| `DevicePreset` | 扩展或替换设备预设。 |

Frame 必须注册 root、content 和 viewport 选择平面。预设的宽高描述可用 viewport，不能通过外框 padding 或 border 移动物料坐标。

设备 Frame 不负责业务页面运行时，也不提供宿主导航栏。继续阅读 [主题、设备与国际化](/guide/customization/theme-device-and-i18n)。
