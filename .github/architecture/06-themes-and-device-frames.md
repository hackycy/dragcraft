# 主题与 Device Frames

本章覆盖 `@dragcraft/designer` 的 Standard 工作台主题，以及 `@dragcraft/device-frames` 提供的无状态 Device Frame Definitions 与 Container Shell adapters。

## 工作台主题

dragcraft 的 UI modules 分开拥有结构与视觉：

- `@dragcraft/ui/structure.css`、designer、renderer 与 form-generator 的 `styles/structure.css` 负责布局和交互几何。
- `@dragcraft/ui/recipe.css` 与 Designer baseline recipes 负责默认视觉。
- `@dragcraft/designer/standard.css` 聚合完整 Standard 结构、tokens 和 recipes。
- `@dragcraft/designer/structure.css` 只提供完全自定义主题所需的结构层。
- 工作台主题不进入 `data-dc-node-surface` 内的业务内容。

Standard 主题使用方式：

```ts
import '@dragcraft/designer/standard.css'
```

完全自定义主题：

```ts
import '@dragcraft/designer/structure.css'
import './my-workbench-theme.css'
```

普通品牌调整应在 Standard 之后覆盖公开 token：

```css
:root {
  --dc-color-accent: #0f766e;
  --dc-color-accent-hover: #115e59;
  --dc-radius-md: 8px;
}
```

完整机器契约由 `@dragcraft/designer/theme-contract.json` 发布，CSS custom data 由 `@dragcraft/designer/css-custom-data.json` 发布。宿主只能依赖公开 token 与精选的 `data-dc-component`、`data-dc-part`、`data-dc-state`；`.dc-*` classes 是 implementation。

主题构建与校验保证：

- Standard 与 structure 两个发布入口均自包含。
- Standard 为每个 public token 提供唯一默认值。
- recipe 不使用 `!important`、私有 class 或 `data-dc-node-surface`。
- render functions 发出的 public hooks 与 manifest 双向一致。
- `renderer-frame-boundary`、`container-shell`、`canvas-surface` 是三个不同语义 hook。

### CSS 自定义属性命名契约

CSS 自定义属性按稳定性分为两个命名空间：

- `--dc-<domain>-<name>` 是公开主题 token 或集成属性。工作台公开属性必须登记在 `theme-contract.json` 的 `tokens` 或 `integrationProperties` 中；Device Frames 等独立公开样式面由所属 package 的架构章节约束。宿主可以依赖已登记或已明确记录的公开属性语义与兼容性。
- `--dc-internal-<owner>-<name>` 是结构层或组件运行时使用的内部属性。`owner` 必须指出负责该属性语义的组件或模块，例如 `renderer`、`canvas`、`form-section`；内部属性不进入主题契约或 CSS custom data，宿主不得读写，也不提供跨版本兼容保证。

内部属性允许通过 CSS 继承连接同一实现中的生产者与消费者。跨 package 使用时，名称仍以语义所有者为 `owner`，生产者、消费者和覆盖该协议的回归测试必须在同一变更中更新。`--_dc-*` 是已废弃的旧命名，不得再作为有效属性被声明或消费。

主题校验器只把非 `--dc-internal-*` 的 `--dc-*` 属性当作公开契约检查，同时拒绝结构 CSS 中残留的 `--_dc-*`。因此内部命名不会被误发布为主题 API，公开属性拼写错误仍会导致构建失败。

## Renderer 与 Container Shell

Renderer 的外层结构固定为：

```text
RootRenderer
  Renderer Frame Boundary                 stable, Renderer-owned
    Active Container Shell               replaceable, slot-only
      Canvas Surface                     Renderer-owned deep module
        scrollport and surface style
        flow regions and empty state
        sticky/flow/fixed Schema chrome
        layers and inset measurement
        content/viewport selection planes
    root selection plane
    forbidden overlay
```

`rendererExtensions.containerShell` 的 interface 是 `Component | Readonly<Ref<Component>>`。Renderer 使用 `isRef()` 显式解析来源，避免把 functional Vue component 当作 getter。静态来源适合固定外壳；readonly ref 允许宿主在现有 Designer 实例上响应式切换。

Container Shell 不接收 props，只能渲染一次 default slot。它不接收 `LayoutPlan`、region/chrome/layer VNodes、registry、surface style、selection presentation 或 forbidden overlay。`DefaultContainerShell` 与设备外壳处于同一个 slot-only seam，没有特权布局协议。

`DefaultContainerShell` 是无设备元素的基础画布外壳：固定宽度 `375px`，高度读取 Renderer 内部变量 `--dc-internal-renderer-default-container-block-size`，未提供时回退为 `667px`，并始终保持至少 `480px`。Designer 复用画布已有的 `ResizeObserver` 测量链路，在同一 animation frame 中读取 viewport 高度，并把 `max(480px, viewport 高度 - 88px)` 的像素结果写入 stage，因此默认外壳保留上下各 `44px`，而内容增长只改变 Canvas Surface 内部 scrollport 的滚动范围。自定义 Container Shell 和 Device Frame 不消费该内部变量。

Renderer 拥有另外两个跨包内部属性：`--dc-internal-renderer-root-selection-plane-outset` 和 `--dc-internal-renderer-root-selection-plane-radius`。Renderer 为默认 Container Shell 提供 outset，并统一消费两者；Device Frames 只在稳定 Frame Boundary 上按当前设备边框宽度和圆角覆盖它们。它们不是 Container Shell 扩展协议，自定义 Shell 不应读写。

Standard 主题通过 `container-shell` 的 `default` state 为默认外壳提供轻投影；直角、无边框和白色 Canvas Surface 仍是普通容器视觉，不引入设备 chrome。默认外壳对应的 Frame Boundary 仅按 `--dc-node-selection-stroke-width` 外扩 root selection plane，使贴顶物料向外绘制的选区边线完整可见；自定义外壳与 Device Frame 继续使用各自既有的 selection outset 规则。

Renderer Frame Boundary 在 Shell 切换时保持同一 DOM 身份，并拥有 toolbar boundary、root selection plane 和 forbidden overlay。Canvas Surface 可能随 Shell 一起重挂载；Schema、Engine 和 history 保持不变，Shell-local scroll 与 widget-local Vue state 不保证保留。Designer 观察当前 Shell 根节点的替换并把 pan offset 归零，使新尺寸重新居中。

Container Shell 可以在 slot 祖先上设置以下集成变量，为 Canvas Surface 提供 safe area：

- `--dc-safe-area-block-start`
- `--dc-safe-area-block-end`
- `--dc-safe-area-inline-start`
- `--dc-safe-area-inline-end`

Schema chrome reserve 仍由 Canvas Surface 写入 `--dc-sized-inset-*` 和 `--dc-measured-inset-*`，两者与 safe area 相加得到 `--dc-inset-*`。设备 system chrome 与 Schema chrome 是不同概念：状态栏、刘海、Home Indicator、Android 导航和浏览器标题栏属于外壳；Schema chrome 始终在 Canvas Surface 内参与 `LayoutPlan`。

## Device Frames 定位

`@dragcraft/device-frames` 只拥有稳定 Device Frame Definitions、无状态 Container Shell adapters、受控 `DevicePicker` 和自包含外观 CSS。

它不拥有 Active Device Frame，不提供 Vue context、provide/inject、controller 或路由 Shell，也不依赖 Designer、Renderer、Core 或 UI。运行时依赖只有 Vue peer dependency 和 `@dragcraft/icons`。

公开 definition：

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

`id` 是开放字符串；自定义设备不受内置 union 限制。内置 definition、嵌套 viewport 和 `BUILT_IN_DEVICE_FRAMES` 均被冻结并保持引用稳定。集合按选择器显示顺序保存相同 definition 引用。

| Definition | ID | 可用 viewport | 设备 system chrome |
| --- | --- | --- | --- |
| `IPHONE_DEVICE_FRAME` | `iphone` | 393x852 | Dynamic Island、现代 iOS 状态栏、Home Indicator |
| `IPHONE_X_DEVICE_FRAME` | `iphone-x` | 375x812 | 刘海、现代 iOS 状态栏、Home Indicator |
| `IPHONE_8_DEVICE_FRAME` | `iphone-8` | 375x667 | 经典 iOS 状态栏 |
| `ANDROID_DEVICE_FRAME` | `android` | 360x720 | Android 状态栏、三键导航 |
| `ANDROID_WATERDROP_DEVICE_FRAME` | `android-waterdrop` | 360x720 | 水滴开孔、三键导航 |
| `TABLET_DEVICE_FRAME` | `tablet` | 768x1024 | 平板状态栏 |
| `DESKTOP_DEVICE_FRAME` | `desktop` | 1280x800 | 浏览器标题栏、交通灯和 URL 栏 |

viewport 尺寸描述 Canvas Surface 可用的业务区域，不包含位于其外部的 system chrome。内置 CSS 固定 definition 对应的几何，definition 不是用于覆盖内置尺寸的配置对象。

## 宿主持有选择

标准数据流：

```text
Host Active Device Frame ID
  -> resolve Device Frame Definition
  -> readonly computed(containerShell)
  -> Designer rendererExtensions.containerShell
  -> RootRenderer resolves current adapter

DevicePicker update:modelValue
  -> Host accepts/rejects/transforms request
  -> Host updates Active Device Frame ID
```

```ts
import { createDesigner } from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import '@dragcraft/device-frames/styles.css'
import { computed, ref } from 'vue'

const activeDeviceFrameId = ref(IPHONE_DEVICE_FRAME.id)
const activeDeviceFrame = computed(() =>
  BUILT_IN_DEVICE_FRAMES.find(item => item.id === activeDeviceFrameId.value)
  ?? IPHONE_DEVICE_FRAME,
)
const activeContainerShell = computed(() => activeDeviceFrame.value.containerShell)

const designer = createDesigner({
  extensions: {
    rendererExtensions: {
      containerShell: activeContainerShell,
    },
  },
})
```

`DevicePicker` 接收 `definitions`、`modelValue` 和可选 `translate`，只发出 `update:modelValue`。分组来自 definition metadata，排序来自输入集合；它不硬编码内置 ID 分组，也不在内部更新选择状态。

## 自定义 Definition

自定义 Container Shell 只决定 slot 放在外观中的位置：

```ts
const ProductPreviewShell = defineComponent({
  setup(_, { slots }) {
    return () => h('div', { class: 'product-preview' }, [
      h('header', 'Preview'),
      h('main', slots.default?.()),
    ])
  },
})

const productPreview: DeviceFrameDefinition = Object.freeze({
  id: 'acme.product-preview',
  label: 'Product Preview',
  viewport: Object.freeze({ width: 1440, height: 900 }),
  containerShell: ProductPreviewShell,
})
```

宿主把它与内置集合组成新的只读目录，并负责 ID 解析、授权、持久化和同步。Renderer 不接收 ID，也不为无效 ID 提供 fallback。

## 文件结构

```text
packages/device-frames/src/
├── definitions.ts
├── types.ts
├── components/
│   ├── DevicePicker.ts
│   ├── frames/
│   │   └── system-icons.ts
│   └── shells/
│       ├── device-container-shell.ts
│       ├── phone-container-shell.ts
│       ├── IPhoneContainerShell.ts
│       ├── IPhoneXContainerShell.ts
│       ├── IPhone8ContainerShell.ts
│       ├── AndroidContainerShell.ts
│       ├── AndroidWaterdropContainerShell.ts
│       ├── TabletContainerShell.ts
│       └── DesktopContainerShell.ts
└── styles/
    ├── index.css
    ├── tokens.css
    ├── device-frame.css
    ├── iphone.css
    ├── android.css
    ├── tablet.css
    └── desktop.css
```

## Device Frame CSS

Device Frame 外观不依赖工作台主题。宿主通过公开 tokens 调整边框、背景、阴影与 system chrome：

- `--dc-device-frame-border-color`
- `--dc-device-frame-border-width`
- `--dc-device-frame-bg`
- `--dc-device-frame-shadow`
- `--dc-device-frame-status-height`
- `--dc-device-frame-titlebar-height`
- `--dc-device-frame-nav-height`

包内 `.dc-device-frame*` classes 与 DOM 层级是私有 implementation。设备 CSS 不包含 flow、Schema chrome、layer、selection plane、forbidden overlay 或 Renderer scrollport 的布局规则。

## 验证约束

- 每个内置 ID 非空且唯一，viewport 宽高是正有限数，Container Shell 已定义。
- `BUILT_IN_DEVICE_FRAMES` 包含公开 constants 的同一引用和固定顺序。
- 每个内置 Shell 通过无 props 的 slot-only interface 挂载，并恰好渲染一次 slot。
- `RootRenderer` 同时覆盖静态 component 与 readonly reactive component ref。
- 切换后完整 flow/chrome/layer 内容仍在，root/content/viewport selection、empty state 与 forbidden overlay 仍由 Renderer 工作。
- Designer 切换后保留 Schema/history，并重置 pan 使新外壳居中。
