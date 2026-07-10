# @dragcraft/device-frames

`@dragcraft/device-frames` 提供设备预览外壳和可选的设备选择器。

先看一个最小示例：

```ts
import {
  createDeviceFrameContext,
  DevicePicker,
  DeviceFrameShell,
} from '@dragcraft/device-frames'

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })

const extensions = {
  rendererExtensions: {
    containerShell: DeviceFrameShell,
  },
}
```

这段代码先创建设备上下文，再把 `DeviceFrameShell` 放进 `rendererExtensions.containerShell`。需要切换设备时，宿主在自己的界面中渲染：

```vue
<DevicePicker :context="deviceCtx" />
```

不渲染 `DevicePicker` 时，Designer 不显示任何设备选择。普通页面容器或业务自定义预览可以只使用自己的 `containerShell`。

如果你还没有把主题和设备框架一起接进设计器，下一页会把完整链路串起来。关于这一层，目前知道这些就够了。准备好之后，继续阅读 [主题与设备框架](/guide/themes-and-device-frames)。
