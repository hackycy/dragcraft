# 主题与设备容器

本章覆盖 `@dragcraft/themes` 与 `@dragcraft/device-frames`。前者聚合可主题化 UI Shell 的结构样式与工作台视觉，后者提供画布容器的设备外壳。

## 可主题化 UI Shell

dragcraft 的组件包拥有自己的 DOM 与必要结构样式：

- `@dragcraft/designer/structure.css`、`@dragcraft/renderer/structure.css` 与 `@dragcraft/form-generator/structure.css` 分别保证所属组件的布局与交互几何。
- `@dragcraft/themes` 聚合结构样式、完整默认 token 与共享基线视觉配方。
- 外部主题只依赖公开 token 与精选的 `data-dc-component`、`data-dc-part`、`data-dc-state`，内部 BEM 是私有实现。
- 工作台主题不负责 `data-dc-node-surface` 内的业务物料；内容主题由宿主独立拥有。

结构样式是 `DcDesigner` 的必要依赖。完整主题已经包含结构样式；只导入 JavaScript 而不加载结构 CSS 不属于支持模式。

## 内置主题

| 主题 | 导入路径 | 风格描述 |
| --- | --- | --- |
| Standard | `@dragcraft/themes` 或 `@dragcraft/themes/standard` | 企业蓝主色、紧凑密度、低阴影，适合高信息密度工作台 |
| Google Material 3 | `@dragcraft/themes/material` | Material 3 色彩角色、舒适密度、圆润形状与分层阴影 |

使用方式：

```ts
import '@dragcraft/themes'
// 或
import '@dragcraft/themes/material'
```

完全自定义视觉配方：

```ts
import '@dragcraft/themes/structure'
import './my-workbench-theme.css'
```

普通品牌主题优先导入 Standard，再增量覆盖 token 和少量公开 hook；不需要重复基线配方。

覆盖变量：

```css
:root {
  --dc-color-accent: #0f766e;
  --dc-color-accent-hover: #115e59;
  --dc-radius-md: 12px;
}
```

## Design Tokens

主题令牌按产品语义与组件角色分层。Standard 为每个公共 token 提供完整默认值，Material 和业务主题只覆盖差异。完整机器契约由 `@dragcraft/themes/theme-contract.json` 发布，编辑器 CSS custom data 由 `@dragcraft/themes/css-custom-data.json` 发布。

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

工作台面板宽度、响应式断点和层级关系不属于主题 token。宽度与断点通过 `DesignerWorkspaceOptions` 配置；z-index 与运行时几何由结构样式拥有。Device Frame 需要协作的选区 overlap 变量属于结构集成契约，而不是视觉主题。

## Themes 文件结构

```plaintext
src/
├── structure.css
├── contract/
│   ├── theme-contract.json
│   └── css-custom-data.json
├── baseline/
│   ├── tokens.css
│   └── recipes.css
├── standard/
│   └── index.css
└── material/
    ├── tokens.css
    ├── recipes.css
    └── index.css
```

`tsdown.config.ts` 把 `structure`、`standard`、`material` 作为三个独立 CSS 构建入口。三个发布文件都必须自包含，不能把共同的结构层或基线配方抽成需要消费者额外加载的共享 chunk。`src/structure.css` 只通过 `@dragcraft/designer/structure.css`、`@dragcraft/renderer/structure.css` 与 `@dragcraft/form-generator/structure.css` 公共子路径聚合样式，tsdown 在构建时将它们内联；主题契约 JSON 同样由 tsdown 复制到 `dist`。PostCSS 仅用于 AST 契约校验，不参与 CSS 打包或 watch。

自定义工作台主题有两种方式：

- 常规方式：导入 `@dragcraft/themes`，覆盖所需 token，并只在 token 无法表达时增加公开 hook recipe。
- 高级方式：导入 `@dragcraft/themes/structure`，基于 manifest 实现完整视觉配方。

## 公共主题契约

```css
:root {
  --dc-color-accent: #0f766e;
  --dc-radius-md: 10px;
}

[data-dc-component="material-item"][data-dc-state~="dragging"] {
  opacity: 0.45;
}
```

官方 recipe 使用普通的公开 component/part/state selector，并按“结构、token、基线 recipe、主题差异 recipe、宿主覆盖”的导入顺序构建。业务优先覆盖 token；token 无法表达时，在主题之后使用相同公开 selector 覆盖 recipe。主题不使用零 specificity 技巧，也禁止 `!important` 和内部 `.dc-*` class，因此维护者只需理解公开 hook 与 CSS 导入顺序。manifest、PostCSS AST 校验和渲染测试共同保证 hook、级联顺序与真实 DOM 一致。

### 节点选中投影

普通物料的 hover 仍驱动命中状态、事件 hooks 和 inline unmasked handle，但不生成范围高亮。resolved 容器的 Frame 外置 handle 未选中时常驻，默认低透明度，仅由自身 hover 或 focus 恢复完整视觉。只有 selected 节点生成 `NodeSelectionProjection`，范围、坐标平面和视觉 presenter 分别由不同模块负责：

```text
NodeOwner -> root-segment | material-bounds
root owner -> root plane
root placement -> inherited subtree content | viewport plane
container owner -> inherited content | viewport plane
container shell -> registered root + content + viewport planes
nodeSelection extension -> visual presenter
```

`NodeSelectionProjection.materialBounds` 始终记录物料真实 border box；`bounds` 记录 presenter 使用的语义范围。`root-segment` 的 `bounds` 横向覆盖完整 root plane，纵向与 `materialBounds` 相同；默认 presenter 的上下边位于物料外侧，左右边占用 Frame 边框带，从而包住物料而不改变盒模型。`material-bounds` 的两个范围相同，严格跟随容器内 child 的 wrapper border box。两种投影都不先求可见交集，也不在裁剪边缘补出假的闭合边。

Device preset 的宽高表示完整可用 viewport，例如 iPhone 的 375px viewport 仍向 flow、chrome 和 layer 提供 375px 内容宽度。Frame 本体与内部 surface 共享同一个 viewport 坐标原点；设备边框由 Frame 外侧的独立视觉层绘制，不参与 Frame 盒模型，内部 surface 只负责设备内容的圆角裁剪，因此 content surface 与 Frame 左右边界完全一致。Frame 不为选中态增加 padding、offset 或 gutter，只继续处理真实 safe area 与 chrome reserve。root plane 从 Frame 边界向外扩展到设备边框外沿；content plane 位于 scroller surface 并随 flow、sticky/flow chrome 子树滚动；viewport plane 固定在设备 viewport 内并承载 fixed chrome/layer 子树。root flow 投影监听祖先滚动以跟随物料，最终仍由各平面的 `overflow: hidden` 自然裁剪。

Renderer 固定 selection projection 的位置和尺寸。默认 `DefaultNodeSelection` 在其中绘制完整连续矩形，工作台主题通过 `--dc-node-selection-stroke-width`、`--dc-color-accent` 和 `node-selection` 的公开 part/state 提供视觉；Frame 可以通过 `--dc-node-selection-root-block-overlap` 与 `--dc-node-selection-root-inline-overlap` 声明根级边线宽度，但这些属性不能改变物料布局。业务可以替换 `rendererExtensions.nodeSelection`，但不能借 presenter 改写投影范围、平面路由或 Frame 裁剪。

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
- 自包含 CSS 样式。设备外观是固有样式，不依赖工作台主题。
- 通过 `selectionPresentation` 注册覆盖完整设备外框的 root 平面、随 scroller 的 content 平面和固定在 viewport 的 viewport 平面；Frame 的外置边框层不参与内容盒模型，内部 surface 负责内容圆角裁剪，并处理真实 safe area/chrome reserve 和层级，不读取 selected 状态，也不为交互视觉增加布局留白。

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

Device frame 的内容区由 `useFrameViewport()` 渲染为 viewport、滚动容器、内容布局、业务 surface 和两个 selection presentation plane。具体 DOM 层级与 `.dc-device-frame*` class 是 `@dragcraft/device-frames` 的私有实现，不属于工作台主题契约。

```plaintext
viewport
  scroll container
    content layout
      block-start chrome
      inline-start chrome | [data-dc-component="container-shell"] | inline-end chrome
      block-end chrome
      content selection presentation plane
  viewport selection presentation plane
```

`DeviceFrameShell` 接收 renderer 已解析的 `surfaceStyle`，不读取 schema。最终样式只应用到声明了 `data-dc-component="container-shell"` 的业务 surface，不重复绘制到 content 外壳或 scroller；`regionVNodes` 中的全部 flow regions 也会合并进同一 content scroller。

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

Device Frame 自己拥有结构与视觉 CSS；宿主只通过其 CSS token 调整视觉，不依赖包内 BEM 或 DOM 层级。主要 CSS 自定义属性：

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
- `--dc-device-z-frame-border`。
- `--dc-device-z-selection`。
- `--dc-node-selection-root-block-overlap`，定义绘制在根级物料上下边界外侧的边线厚度。
- `--dc-node-selection-root-inline-overlap`，定义 root plane 两侧边框带中的边线宽度，默认继承 Frame border width。

约束：

- `DeviceFrameShell` 是稳定组件引用，作为 renderer `containerShell` 传入。
- 只有 `position: fixed` 的 chrome 进入 viewport chrome layer 并贡献 measured/sized inset；同一 edge 的 fixed chrome 使用 flex stack，从边缘向内排列，reserved stack 与 inset 累加值一致，`avoidContent: false` 的 overlay stack 独立覆盖且不占用 inset。`sticky` 与 `flow` chrome 留在 content scroller，block 边位于业务 surface 上下，inline 边与业务 surface 组成三列布局。
- 未提供 context 时自动降级为 iPhone 容器。
- 设备框架内部层级是局部层级；`.dc-device-frame` 使用独立 stacking context，业务 `chrome/layer` 只在设备页面内排序，不参与设计器面板、节点工具栏或应用弹窗的全局层级竞争。
- 所有 Frame 组件内容 surface 必须声明 `data-dc-component="container-shell"` 作为公开语义标记；Renderer 的 Default Shell grid、inset 变量初始化和 stacking context 只能绑定 `.dc-container-shell`，不得通过该共享标记污染 Frame 私有结构。
- preset 宽高必须保持为完整可用 viewport 尺寸；Frame 本体、内部 surface 与 viewport 必须共享左右坐标边界，设备边框通过外置视觉层向外扩展，内部 surface 独立承担圆角裁剪。不得通过 Frame border/padding、content inset、content surface padding 或 node border 移动物料坐标。
- root 平面必须是 Frame 根元素的直接子节点并覆盖完整 Frame；内容平面必须位于实际 scroller surface 内并随内容自然滚动；视口平面固定在 viewport 内。content/viewport 平面的安全区内部不得被 Frame 装饰遮挡。
