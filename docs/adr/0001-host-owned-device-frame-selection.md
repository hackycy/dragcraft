---
status: accepted
---

# Device Frame Definition 保持无状态并由宿主选择

`@dragcraft/device-frames` 稳定暴露各个 Device Frame Definition，宿主拥有 Active Device Frame，并通过响应式扩展 seam 把对应 Container Shell 交给 Renderer。设备 Container Shell 只渲染外形和 default slot；slot 包含完整 Canvas Surface，因此 Frame 定制不需要了解布局 region、chrome/layer 分区、滚动、选择平面或 Renderer 拥有的 overlay。

## 考虑过的方案

- 拒绝 device-frame context 加稳定路由 Shell，因为它让 `@dragcraft/device-frames` 拥有选择状态，并在 Renderer 扩展 seam 之外形成第二套切换机制。
- 拒绝把定义、状态和 Shell 打包为 device-frame controller；Frame 选择是宿主应用状态，不是 device-frame package 状态。
- 拒绝向每个设备 Shell 传递布局计划和分区渲染节点，因为这会把视觉外壳变成第二个内容 Renderer，并向 Frame 作者暴露 Renderer 复杂度。

## 影响

- 内置和自定义 Device Frame Definition 使用开放字符串标识，可以组合进宿主持有的目录。
- Renderer 的 container-shell 扩展必须接受响应式 Shell 来源，使宿主无需设备专用路由器即可切换定义。
- 如果提供 `DevicePicker`，它是宿主定义与选择状态之上的受控视图，不依赖 device-frame context。
- `createDeviceFrameContext`、`DEVICE_FRAME_CONTEXT_KEY` 和 `DeviceFrameShell` 的有状态路由职责被宿主选择模型取代。
- 切换 Shell 可能重建其 slot 中的 Canvas Surface；临时 DOM 和滚动状态应由 Renderer 明确定义并测试保留或重置语义，而不能隐藏在 `@dragcraft/device-frames` 中。
