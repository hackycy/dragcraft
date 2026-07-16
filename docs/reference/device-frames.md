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

`DeviceFrameShell` 还消费 Renderer 传入的 `selectionPresentation`，注册两个覆盖 Frame border box 的 selected 呈现平面：内容平面位于 scroller surface 内并随页面滚动，视口平面固定在设备 viewport 内。Frame 把物料内容按边框宽度内缩，在 selected 下方单独绘制设备边框，并按完整 chrome wrapper 计算 reserve；`--dc-node-selection-root-block-overlap` 同时在 viewport/chrome 外沿和 scroller 首尾提供 gutter，使 navbar、tabbar 与 flow 物料的外侧上下边都可见且不重叠。圆角或弧形边框仍由同一个 `overflow: hidden` 自然裁剪。Frame 不读取 selected 状态，也不计算投影范围。

如果你还没有把主题和设备框架一起接进设计器，下一页会把完整链路串起来。关于这一层，目前知道这些就够了。准备好之后，继续阅读 [主题与设备框架](/guide/themes-and-device-frames)。
