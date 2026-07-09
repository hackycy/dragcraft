# @dragcraft/device-frames

`@dragcraft/device-frames` 提供设备预览外壳和设备切换工具栏。

先看一个最小示例：

```ts
import {
  createDeviceFrameContext,
  createDeviceToolbarRenderer,
  DeviceFrameShell,
} from '@dragcraft/device-frames'

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })

const extensions = {
  containerShell: DeviceFrameShell,
  toolbarRenderer: createDeviceToolbarRenderer(deviceCtx),
}
```

这段代码展示了它最常见的接入方式。我们先创建一个设备上下文，再把 `DeviceFrameShell` 交给 renderer 的容器壳扩展点，把 `createDeviceToolbarRenderer(deviceCtx)` 交给 designer 的工具栏扩展点。

如果你还没有把主题和设备框架一起接进设计器，下一页会把完整链路串起来。关于这一层，目前知道这些就够了。准备好之后，继续阅读 [主题与设备框架](/guide/themes-and-device-frames)。
