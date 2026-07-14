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
| shadcn | `@dragcraft/themes` 或 `@dragcraft/themes/shadcn` | 企业蓝主色、紧凑密度、低阴影，适合高信息密度工作台 |
| Google Material 3 | `@dragcraft/themes/material` | Material 3 色彩角色、舒适密度、圆润形状与分层阴影 |

使用方式：

```ts
import '@dragcraft/themes/shadcn'
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
  --dc-color-accent: #0f766e;
  --dc-color-accent-hover: #115e59;
  --dc-radius-md: 12px;
}
```

## Design Tokens

主题令牌按产品语义分层。组件只读取语义角色，不读取 shadcn 或 Material 的原始品牌色值。

### 颜色角色

| 变量 | 说明 |
| --- | --- |
| `--dc-color-accent` | 主操作与选中态 |
| `--dc-color-accent-hover` | 主操作 hover |
| `--dc-color-accent-subtle` | 低强调选中背景 |
| `--dc-color-on-accent` | 主色表面的内容 |
| `--dc-color-success` / `warning` / `danger` | 状态反馈 |
| `--dc-color-text` / `text-muted` / `text-subtle` | 三级内容色 |
| `--dc-color-surface` / `surface-subtle` / `surface-muted` | 表面层级 |
| `--dc-color-canvas` | 画布工作区背景 |
| `--dc-color-border` / `border-subtle` | 标准与弱边界 |
| `--dc-color-focus-ring` | 键盘焦点环 |
| `--dc-color-backdrop` | 抽屉遮罩 |

### 排版、形状、密度与动效

| 变量 | 说明 |
| --- | --- |
| `--dc-font-sans` | UI 字体族 |
| `--dc-font-size-xs` / `sm` / `md` / `lg` | 字号阶梯 |
| `--dc-font-weight-regular` / `medium` / `semibold` | 字重阶梯 |
| `--dc-radius-sm` / `md` / `lg` / `full` | 圆角阶梯 |
| `--dc-control-height-sm` / `md` / `lg` | 控件密度阶梯 |
| `--dc-shadow-sm` / `md` / `lg` | 表面层级 |
| `--dc-duration-fast` / `normal` | 动效时长 |
| `--dc-ease-standard` | 标准缓动 |

### 工作台布局

| 变量 | 说明 |
| --- | --- |
| `--dc-panel-header-height` | 面板头部高度 |
| `--dc-workspace-left-width` | 宽屏左侧 Dock 宽度 |
| `--dc-workspace-right-width` | 宽屏 Inspector 宽度 |
| `--dc-workspace-rail-width` | 折叠栏宽度 |
| `--dc-workspace-drawer-width` | compact 抽屉宽度 |

### 层级

| 变量 | 说明 |
| --- | --- |
| `--dc-z-node-mask` | 节点透明遮罩 |
| `--dc-z-node-handle` | 非遮罩节点的选中 handle |
| `--dc-z-designer-portal` | 画布专属交互层 |
| `--dc-z-canvas-toolbar` | 工作台顶部工具栏 |
| `--dc-z-canvas-forbidden` | 画布禁止拖入提示 |
| `--dc-z-node-overlay` | Teleport 后的节点 hover/selected 外框 |
| `--dc-z-node-toolbar` | Teleport 后的节点浮动工具栏 |
| `--dc-z-designer-panel` | 左右设计器面板 |
| `--dc-z-app-modal` | 应用级模态层 |

## Themes 文件结构

```plaintext
src/
├── base.css
├── foundation.css
├── components/
│   ├── reset.css
│   ├── designer.css
│   ├── canvas.css
│   ├── material-panel.css
│   ├── property-panel.css
│   ├── form-generator.css
│   └── widgets.css
├── shadcn/
│   ├── tokens.css
│   ├── overrides.css
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
| `.dc-node--root-owned` | root-owned 节点交互投影 |
| `.dc-node--container-owned` | container-owned 节点交互投影 |
| `.dc-node__mask` | 透明遮罩 |
| `.dc-node__handle` | 选中 handle |
| `.dc-node__toolbar` | 浮动工具栏 |
| `.dc-node__toolbar--floating` | fixed 定位工具栏 |
| `.dc-node__toolbar--vertical` | root-owned 纵向动作排列 |
| `.dc-node__toolbar--horizontal` | container-owned 横向动作排列 |
| `.dc-drop-indicator` | 拖拽指示器 |
| `.dc-widget-fallback` | 未知 widget fallback |

### 节点交互轮廓

节点轮廓由 renderer 计算安全绘制区域，主题只决定颜色。固定交互契约如下：

```text
visible rect
  -> 四边按 1px 描边宽度生成 paint rect
  -> hover: 1px dashed
  -> selected: 1px solid
```

`useNodeInteractionGeometry()` 先求节点与裁剪边界的可见交集，再通过 `paintInset` 生成 paint rect。`root-band` 使用 viewport boundary 的宽度和节点可见高度；`node-box` 使用 wrapper border box 的二维可见交集。常规节点四边各收进 1px；极小节点会限制 inset，始终保留至少 1px 的可绘制宽高。零尺寸或完全不可见的节点不绘制轮廓。

`WidgetRenderer` 是描边宽度与线型的唯一来源：它通过 `--dc-node-overlay-stroke-width` 传递宽度，并按运行时状态设置 `outline-style`。主题不得改变描边宽度、线型、透明背景或几何 inset，只能设置 `--dc-color-accent`。

## Device Frames 定位

`@dragcraft/device-frames` 提供设备容器框架组件，用于 renderer 的 `containerShell` 扩展点。

目标：

- 提供 iPhone、Android、平板、桌面浏览器四种常见设备容器。
- 支持运行时动态切换设备类型。
- 提供独立 `DevicePicker`，由宿主决定放在应用顶栏或其他产品区域。
- 不依赖 designer 或 renderer；依赖 Vue、`@dragcraft/core` 的 layout/schema 类型，以及 `@dragcraft/icons` 的设备切换图标。

设计边界：

- 不含业务逻辑，只负责设备容器视觉外壳。
- 不读取业务 `globalConfig` 字段，不定义页面背景等业务配置协议。
- 只消费 renderer 传入的 schema DSL 预览信息，例如 `root.style.surface`。
- 通过 Vue provide/inject 管理设备状态。
- 自包含 CSS 样式。设备外观是固有样式，不依赖主题皮肤。

## Device Frames 使用方式

```ts
import { createDesigner } from '@dragcraft/designer'
import {
  createDeviceFrameContext,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
  DevicePicker,
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
  },
})
```

设备选择不是 Designer 的默认能力。宿主可以直接渲染 `<DevicePicker :context="deviceCtx" />`；Playground 把它放在应用顶栏，不占用画布交互区。

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
│   ├── DevicePicker.ts
│   └── frames/
│       ├── IPhoneFrame.ts
│       ├── AndroidFrame.ts
│       ├── TabletFrame.ts
│       └── DesktopFrame.ts
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

## 页面 Surface 预览

Device frame 的内容区由 `useFrameViewport()` 渲染：

```plaintext
.dc-device-frame__viewport
  .dc-device-frame__content
    .dc-device-frame__content-scroller
      .dc-device-frame__content-surface.dc-container-shell
```

`DeviceFrameShell` 接收 renderer 传入的 `schema`，把 `schema.root.style.surface` 作为开放样式对象传给具体 frame。最终样式应用到 `.dc-device-frame__content-surface`，用于预览页面承载面效果。

示例：

```ts
root: {
  id: 'root',
  type: 'root',
  props: {},
  style: {
    surface: {
      backgroundColor: '#f7f7f7',
      backgroundImage: 'url(https://example.com/page-bg.png)',
      backgroundSize: 'cover',
    },
  },
  children: [],
}
```

Device frame 不枚举这些字段，也不保证非 Web 运行时的最终渲染语义；跨端消费方应按自身平台解释同一份 DSL。

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
