---
description: "@dragcraft/device-frames 的设备预览外壳、设备选择器和选中投影平面 API 参考。"
---

# @dragcraft/device-frames

`@dragcraft/device-frames` 提供设备预览外壳和可选的分组设备选择器。

先看一个最小示例：

```vue
<script setup lang="ts">
import { provide } from 'vue'
import {
  createDeviceFrameContext,
  DEVICE_FRAME_CONTEXT_KEY,
  DevicePicker,
  DeviceFrameShell,
} from '@dragcraft/device-frames'

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })
provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)

const extensions = {
  rendererExtensions: {
    containerShell: DeviceFrameShell,
  },
}
</script>
```

这段代码先创建设备上下文并提供给设备组件，再把 `DeviceFrameShell` 放进 `rendererExtensions.containerShell`。`provide()` 必须位于承载 Designer 与 `DevicePicker` 的共同祖先组件中。需要切换设备时，宿主在自己的界面中渲染：

```vue
<DevicePicker :context="deviceCtx" />
```

不渲染 `DevicePicker` 时，Designer 不显示任何设备选择。普通页面容器或业务自定义预览可以只使用自己的 `containerShell`。

## 内置预设

| ID | 设备 | viewport | 系统栏特征 |
| --- | --- | --- | --- |
| `iphone` | iPhone 15 Pro | 393x852 | Dynamic Island、Home Indicator |
| `iphone-x` | iPhone X | 375x812 | 刘海屏、Home Indicator |
| `iphone-8` | iPhone 8 | 375x667 | 经典状态栏、无屏内导航 |
| `android` | Android | 360x720 | 普通状态栏、三键导航 |
| `android-waterdrop` | Android 水滴屏 | 360x720 | 水滴开孔、三键导航 |
| `tablet` | Tablet | 768x1024 | 平板状态栏 |
| `desktop` | Desktop | 1280x800 | 浏览器窗口栏 |

`getDefaultPresets()` 按表格顺序返回全部 7 个预设。可以通过 `IPHONE_X_PRESET`、`IPHONE_8_PRESET`、`ANDROID_WATERDROP_PRESET` 单独引用新增预设，也可以直接使用对应的 `IPhoneXFrame`、`IPhone8Frame`、`AndroidWaterdropFrame`。已有 `iphone` ID 保持兼容，但现在使用校正后的 iPhone 15 Pro 尺寸。

`DeviceFrameShell` 还消费 Renderer 传入的 `selectionPresentation`，注册三个 selected 呈现平面：root 平面是 Frame 根元素的直接子节点并覆盖完整设备外框，内容平面位于 scroller surface 内并随页面滚动，视口平面固定在设备 viewport 内。preset 的宽高始终是完整可用 viewport 尺寸；Frame 本体和内部 surface 共享同一内容坐标，设备边框由 Frame 外侧的独立视觉层绘制，不通过 Frame border/padding、content inset、content surface padding 或 node border 移动物料。root 选框通过独立平面覆盖完整外壳。Frame 仍按完整 chrome wrapper 计算真实内容 reserve，并且不读取 selected 状态或计算投影范围。

设备框架与主题的导入顺序、选中投影和画布行为见 [主题与设备框架](/guide/themes-and-device-frames)。
