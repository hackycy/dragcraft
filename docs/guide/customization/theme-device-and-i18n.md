---
description: "使用公开主题契约、受控 Device Frame 和消息包定制工作台。"
---

# 主题、设备与国际化

工作台主题、设备外壳和业务页面内容是三个独立层。改变品牌色不应修改业务物料 CSS，切换 Device Frame 也不应修改页面 Schema。

## 覆盖公开主题 token

贯穿项目先导入 Standard 主题，再加载品牌 token：

<<< ../../../examples/guide-project/src/brand-theme.css

token 适合颜色、字号、圆角、密度、阴影和动效。只有 token 无法表达局部视觉时，才使用公开的 `data-dc-component`、`data-dc-part` 和 `data-dc-state` hook。

不要依赖私有 `.dc-*` class、选择器顺序或 `!important`。这些实现细节可以在不改变公共主题契约的情况下调整。

## 选择样式入口

| 目标 | 导入方式 | 你的责任 |
| --- | --- | --- |
| 使用完整工作台并调整品牌 | `@dragcraft/designer/standard.css` | 覆盖少量公开 token |
| 实现整套工作台视觉 | `@dragcraft/designer/structure.css` | 补齐全部视觉 recipe 和主题契约 |
| 样式化画布内业务内容 | 业务 CSS | 自己维护内容主题和跨端映射 |

结构入口只保证布局与交互所需几何，不会提供可用的完整视觉。

## 让宿主持有设备选择

完整应用使用受控 `DevicePicker`：

```ts
import '@dragcraft/designer/standard.css'
import '@dragcraft/device-frames/styles.css'
```

```ts
const activeDeviceFrameId = ref(IPHONE_DEVICE_FRAME.id)
const activeDeviceFrame = computed(() =>
  BUILT_IN_DEVICE_FRAMES.find(item => item.id === activeDeviceFrameId.value)
  ?? IPHONE_DEVICE_FRAME,
)
```

```vue
<DcDesigner :instance="designer" :device-frame="activeDeviceFrame" />
```

Picker 只发出请求的 ID，宿主决定是否接受并更新状态。当前 definition 通过 `DcDesigner.deviceFrame` 传给 Designer 后，可以在现有实例上切换设备；document 和 history 不会重建。

Device Frame 只模拟设计态 viewport 和系统 UI。生产运行时根据目标平台决定真实安全区、导航和窗口尺寸。

## 覆盖编辑器消息

示例只覆盖业务需要变化的消息键：

<<< ../../../examples/guide-project/src/editor/messages.ts

`messages` 与内置消息树合并，未覆盖的键继续使用默认文本。编辑器 UI 和业务页面正文使用不同的消息系统；不要把活动内容文案塞进 Designer messages。

## 验证定制

- 品牌覆盖只使用公开 token 或 data hook。
- 切换设备后页面数据和撤销栈不变。
- Device Frame 只渲染一次 Canvas Surface slot。
- 改变 `locale` 后工作台消息更新，业务正文保持自己的语言状态。

完整 token 契约见 [样式与国际化参考](/reference/designer-styles)，设备 definitions 见 [Device Frames 参考](/reference/device-frames)。
