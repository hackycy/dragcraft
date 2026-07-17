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

`DeviceFrameShell` 还消费 Renderer 传入的 `selectionPresentation`，注册三个 selected 呈现平面：root 平面是 Frame 根元素的直接子节点并覆盖完整 Frame，内容平面位于 scroller surface 内并随页面滚动，视口平面固定在设备 viewport 内。Frame 把 flow、chrome 和 layer 的横向内容边界统一放在边框内沿，使物料不被边框覆盖；root 选框则通过独立平面覆盖 Frame 边框。物料布局不因选中视觉产生 padding、offset 或 gutter。Frame 仍按完整 chrome wrapper 计算真实内容 reserve，圆角或弧形边框由同一个 `overflow: hidden` 自然裁剪。Frame 不读取 selected 状态，也不计算投影范围。

如果你还没有把主题和设备框架一起接进设计器，下一页会把完整链路串起来。关于这一层，目前知道这些就够了。准备好之后，继续阅读 [主题与设备框架](/guide/themes-and-device-frames)。
