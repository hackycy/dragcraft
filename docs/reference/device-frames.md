---
description: "@dragcraft/device-frames 的无状态 Device Frame Definitions、Container Shells 与受控选择器。"
---

# @dragcraft/device-frames

Device Frame Definition 是引用稳定的只读目录项。宿主持有 Active Device Frame，并将整个 definition 传给 `DcDesigner`。

```ts
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import '@dragcraft/device-frames/styles.css'
import { computed, ref } from 'vue'

const activeId = ref(IPHONE_DEVICE_FRAME.id)
const activeDefinition = computed(() =>
  BUILT_IN_DEVICE_FRAMES.find(item => item.id === activeId.value)
  ?? IPHONE_DEVICE_FRAME,
)

const designer = createDesigner({ schema, materials })
```

```vue
<DcDesigner :instance="designer" :device-frame="activeDefinition" />
```

## Definition

```ts
interface DeviceFrameDefinition {
  readonly id: string
  readonly label: string
  readonly labelKey?: string
  readonly icon?: string | Component
  readonly group?: DeviceFrameGroup
  readonly viewport: {
    readonly width: number
    readonly height: number
  }
  readonly containerShell: Component
}
```

`id` 是开放字符串。`viewport` 描述可用业务 viewport，不包含设备状态栏、底部系统导航或桌面标题栏。内置 definitions、viewport 对象与 `BUILT_IN_DEVICE_FRAMES` 均被冻结，集合包含单个导出 constants 的同一引用。

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `IPHONE_DEVICE_FRAME` | iPhone 15 Pro definition，393x852。 |
| `IPHONE_X_DEVICE_FRAME` | iPhone X definition，375x812。 |
| `IPHONE_8_DEVICE_FRAME` | iPhone 8 definition，375x667。 |
| `ANDROID_DEVICE_FRAME` | Android definition，360x720。 |
| `ANDROID_WATERDROP_DEVICE_FRAME` | 水滴屏 Android definition，360x720。 |
| `TABLET_DEVICE_FRAME` | Tablet definition，768x1024。 |
| `DESKTOP_DEVICE_FRAME` | Desktop definition，1280x800。 |
| `BUILT_IN_DEVICE_FRAMES` | 按选择器显示顺序排列的只读内置目录。 |
| `DevicePicker` | 受控设备选择视图。 |
| `DeviceFrameDefinition` | 自定义 definition interface。 |

## 受控 Device Picker

```vue
<DevicePicker
  :definitions="definitions"
  :model-value="activeId"
  :translate="hostI18n.t"
  @update:model-value="selectDeviceFrame"
/>
```

Picker 不保存或修改选择状态。它按 definition group metadata 分组、按输入集合排序，并发出请求的字符串 ID。宿主负责接受、拒绝或转换请求，再解析对应 definition。

## 自定义外壳

Container Shell 不接收 Designer Presentation props，并且必须恰好渲染一次 default slot：

```ts
const WidePreviewShell = defineComponent({
  setup(_, { slots }) {
    return () => h('div', { class: 'wide-preview' }, slots.default?.())
  },
})

const widePreview: DeviceFrameDefinition = Object.freeze({
  id: 'acme.wide-preview',
  label: 'Wide Preview',
  viewport: Object.freeze({ width: 1440, height: 900 }),
  containerShell: WidePreviewShell,
})
```

slot 已包含完整 Canvas Surface 业务预览：flow、chrome、layer、scroll、insets 与 empty state。外壳不能读取 Schema、重建业务节点或处理 Designer 的交互层。设备 system chrome 可以放在 slot 前后，并可通过 `--dc-safe-area-*` 变量向 Canvas Surface 声明安全区。

设备 Frame 只用于设计态预览，不负责业务页面运行时。继续阅读 [主题、设备与国际化](/guide/customization/theme-device-and-i18n)。

设备外壳的公开外观 CSS 不会随 JavaScript 入口自动加载；应用入口还必须导入 `@dragcraft/device-frames/styles.css`。如果同时使用 Designer Standard 主题，先导入 `@dragcraft/designer/standard.css`，再导入设备外壳样式。
