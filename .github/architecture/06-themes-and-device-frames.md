# 主题与设备容器

本章覆盖 `@dragcraft/themes` 与 `@dragcraft/device-frames`。前者提供 Headless 组件库的视觉皮肤，后者提供画布容器的设备外壳。

## Headless 主题模型

dragcraft 的 UI 包采用 Headless Component 模式：

- 组件只输出 `dc-*` BEM class。
- 组件逻辑不捆绑 CSS。
- 视觉样式由 `@dragcraft/themes` 或业务自定义 CSS 提供。

`@dragcraft/themes` 独立提供完整 CSS，与组件逻辑解耦。

## 内置皮肤

| 皮肤 | 导入路径 | 风格描述 |
| --- | --- | --- |
| Ant Design | `@dragcraft/themes/antd` | 蓝色主调，4px 圆角，轻柔阴影，系统字体 |
| Material Design | `@dragcraft/themes/material` | 蓝色主调，8px 圆角，Material 分层阴影，Roboto 字体 |

使用方式：

```ts
import '@dragcraft/themes/antd'
// 或
import '@dragcraft/themes/material'
```

无头模式：

```ts
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import './my-custom-styles.css'
```

覆盖变量：

```css
:root {
  --dc-primary: #722ed1;
  --dc-radius: 12px;
}
```

## Design Tokens

### 主色

| 变量 | 说明 |
| --- | --- |
| `--dc-primary` | 主色 |
| `--dc-primary-light` | 主色浅色 |
| `--dc-primary-dark` | 主色深色 |
| `--dc-primary-bg-hover` | 主色 hover 背景 |
| `--dc-primary-shadow` | 主色阴影 |
| `--dc-on-primary` | 主色上的文字 |

### 语义色

| 变量 | 说明 |
| --- | --- |
| `--dc-success` | 成功 |
| `--dc-warning` | 警告 |
| `--dc-danger` | 危险 |
| `--dc-danger-bg-hover` | 危险 hover 背景 |

### 文字、边框与背景

| 变量 | 说明 |
| --- | --- |
| `--dc-text` | 主文本 |
| `--dc-text-secondary` | 次级文本 |
| `--dc-text-placeholder` | 占位文本 |
| `--dc-border` | 标准边框 |
| `--dc-border-light` | 浅边框 |
| `--dc-bg` | 标准背景 |
| `--dc-bg-light` | 浅背景 |
| `--dc-bg-dark` | 深背景 |
| `--dc-canvas-bg` | 画布背景 |

### 效果、形状与排版

| 变量 | 说明 |
| --- | --- |
| `--dc-shadow` | 标准阴影 |
| `--dc-shadow-sm` | 小阴影 |
| `--dc-radius` | 标准圆角 |
| `--dc-radius-lg` | 大圆角 |
| `--dc-font-size` | 标准字号 |
| `--dc-font-size-sm` | 小字号 |
| `--dc-font-family` | 字体族 |
| `--dc-panel-header-height` | 面板头部高度 |
| `--dc-toolbar-height` | 工具栏高度 |

### 层级

| 变量 | 说明 |
| --- | --- |
| `--dc-z-node-mask` | 节点透明遮罩 |
| `--dc-z-node-handle` | 非遮罩节点的选中 handle |
| `--dc-z-designer-portal` | 设计器画布交互层 portal，低于画布顶部工具栏 |
| `--dc-z-canvas-toolbar` | 画布顶部工具栏 |
| `--dc-z-canvas-forbidden` | 画布禁止拖入提示 |
| `--dc-z-node-overlay` | Teleport 后的节点 hover/selected 外框 |
| `--dc-z-node-toolbar` | Teleport 后的节点浮动工具栏 |
| `--dc-z-designer-panel` | 左右设计器面板 |
| `--dc-z-app-modal` | 应用级模态层 |

## Themes 文件结构

```plaintext
src/
├── components/
│   ├── reset.css
│   ├── designer.css
│   ├── canvas.css
│   ├── material-panel.css
│   ├── property-panel.css
│   ├── form-generator.css
│   └── widgets.css
├── antd/
│   ├── tokens.css
│   └── index.css
└── material/
    ├── tokens.css
    ├── overrides.css
    └── index.css
```

自定义皮肤有两种方式：

- 导入基础皮肤后覆盖 CSS 变量。
- 不导入任何皮肤，参照 `src/components/` 为所有 `dc-*` BEM class 编写样式。

## 画布相关 class

| 类名 | 说明 |
| --- | --- |
| `.dc-empty-state` | 空画布占位容器 |
| `.dc-node` | 节点基础容器 |
| `.dc-node--widget` | widget 节点 |
| `.dc-node--masked` | mask=true 的节点 |
| `.dc-node--unmasked` | mask=false 的节点 |
| `.dc-node--selected` | 选中状态 |
| `.dc-node--hovered` | 悬停状态 |
| `.dc-node--drag-over` | 拖拽悬停状态 |
| `.dc-node--locked` | 位置锁定状态 |
| `.dc-node__mask` | 透明遮罩 |
| `.dc-node__handle` | 选中 handle |
| `.dc-node__toolbar` | 浮动工具栏 |
| `.dc-node__toolbar--floating` | fixed 定位工具栏 |
| `.dc-drop-indicator` | 拖拽指示器 |
| `.dc-widget-fallback` | 未知 widget fallback |

## Device Frames 定位

`@dragcraft/device-frames` 提供设备容器框架组件，用于 renderer 的 `containerShell` 扩展点。

目标：

- 提供 iPhone、Android、平板、桌面浏览器四种常见设备容器。
- 支持运行时动态切换设备类型。
- 提供 toolbar 工厂函数，便于在画布工具栏中集成设备切换按钮。
- 不依赖 designer 或 renderer，仅依赖 Vue。

设计边界：

- 不含业务逻辑，只负责设备容器视觉外壳。
- 通过 Vue provide/inject 管理设备状态。
- 自包含 CSS 样式。设备外观是固有样式，不依赖主题皮肤。

## Device Frames 使用方式

```ts
import { createDesigner } from '@dragcraft/designer'
import {
  createDeviceFrameContext,
  createDeviceToolbarRenderer,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
} from '@dragcraft/device-frames'
import '@dragcraft/device-frames/styles'
import { provide } from 'vue'

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })
provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)

const designer = createDesigner({
  extensions: {
    rendererExtensions: {
      containerShell: DeviceFrameShell,
    },
    toolbarRenderer: createDeviceToolbarRenderer(deviceCtx),
  },
})
```

## Device Frames 文件结构

```plaintext
src/
├── types.ts
├── context.ts
├── presets.ts
├── composables/
│   └── useDeviceFrame.ts
├── components/
│   ├── DeviceFrameShell.ts
│   └── frames/
│       ├── IPhoneFrame.ts
│       ├── AndroidFrame.ts
│       ├── TabletFrame.ts
│       └── DesktopFrame.ts
├── toolbar/
│   └── createDeviceToolbarRenderer.ts
├── styles/
│   ├── index.css
│   ├── tokens.css
│   ├── device-frame.css
│   ├── iphone.css
│   ├── android.css
│   ├── tablet.css
│   └── desktop.css
└── index.ts
```

## 设备预设

```ts
interface DevicePreset {
  type: DeviceType
  label: string
  icon: string
  width: number
  height: number
  frameComponent: Component
}
```

内置预设：

| 设备 | type | 尺寸 | 视觉特征 |
| --- | --- | --- | --- |
| iPhone | `iphone` | 375x812 | Dynamic Island、状态栏、Home Indicator |
| Android | `android` | 360x800 | 状态栏、底部导航栏 |
| Tablet | `tablet` | 768x1024 | 简洁状态栏、薄边框 |
| Desktop | `desktop` | 1280x800 | 浏览器标题栏、交通灯、URL 栏 |

## DeviceFrameContext

```ts
interface DeviceFrameContext {
  currentDevice: Ref<DeviceType>
  presets: readonly DevicePreset[]
  getPreset: (type: DeviceType) => DevicePreset | undefined
  setDevice: (type: DeviceType) => void
}
```

数据流：

```plaintext
setup() -> createDeviceFrameContext()
        -> provide(DEVICE_FRAME_CONTEXT_KEY, ctx)

DcDesigner -> DcCanvas -> RootRenderer -> DeviceFrameShell
DeviceFrameShell -> inject(ctx) -> currentDevice -> frameComponent

toolbar click -> ctx.setDevice('android') -> activeFrame recompute
```

## Device Frame CSS

BEM：

- Block：`dc-device-frame`。
- Elements：`__status-bar`、`__status-time`、`__status-icons`、`__notch`、`__content`、`__home-indicator`、`__nav-bar`、`__nav-btn`、`__title-bar`、`__traffic-lights`、`__traffic-dot`、`__url-bar`。
- Modifiers：`--iphone`、`--android`、`--tablet`、`--desktop`、`--dynamic-island`、`--close`、`--minimize`、`--maximize`、`--home`。

CSS 自定义属性：

- `--dc-device-frame-border-color`。
- `--dc-device-frame-border-width`。
- `--dc-device-frame-bg`。
- `--dc-device-frame-shadow`。
- `--dc-device-frame-status-height`。
- `--dc-device-frame-titlebar-height`。
- `--dc-device-frame-nav-height`。
- `--dc-device-z-scrollbar`。
- `--dc-device-z-chrome-item`。
- `--dc-device-z-chrome`。
- `--dc-device-z-layer`。

约束：

- `DeviceFrameShell` 是稳定组件引用，作为 renderer `containerShell` 传入。
- 未提供 context 时自动降级为 iPhone 容器。
- 设备框架内部层级是局部层级；`.dc-device-frame` 使用独立 stacking context，业务 `chrome/layer` 只在设备页面内排序，不参与设计器面板、节点工具栏或应用弹窗的全局层级竞争。
- 所有 Frame 组件内容区必须包含 `dc-container-shell` class。
