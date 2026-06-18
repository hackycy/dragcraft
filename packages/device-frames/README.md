# @dragcraft/device-frames

`@dragcraft/device-frames` 提供开箱即用的设备容器框架组件，用于 `@dragcraft/renderer` 的 `containerShell` 扩展点。

## 目标

- 提供多种常见设备容器（iPhone、Android、平板、桌面浏览器）。
- 支持运行时动态切换设备类型。
- 提供 toolbar 工厂函数，便于在画布工具栏中集成设备切换按钮。
- 零框架依赖：不依赖 `@dragcraft/designer` 或 `@dragcraft/renderer`，仅依赖 `vue`。

## 设计边界

- 不含业务逻辑，仅负责设备容器的视觉外壳渲染。
- 通过 Vue provide/inject 管理设备状态，不修改框架核心。
- 自包含 CSS 样式（设备外观是固有的，不依赖主题皮肤）。

## 快速上手

```ts
import { createDesigner, DcDesigner } from '@dragcraft/designer'
import {
  createDeviceFrameContext,
  createDeviceToolbarRenderer,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
} from '@dragcraft/device-frames'
import '@dragcraft/device-frames/styles'
import { provide } from 'vue'

// 1. 创建设备上下文
const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })

// 2. 在 setup 中 provide
provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)

// 3. 创建 designer，使用 DeviceFrameShell 作为 containerShell
const designer = createDesigner({
  // ...
  extensions: {
    rendererExtensions: {
      containerShell: DeviceFrameShell,
    },
    toolbarRenderer: createDeviceToolbarRenderer(deviceCtx),
  },
})
```

## 文件结构

```
src/
├── types.ts                              # 类型定义 + InjectionKey
├── context.ts                            # createDeviceFrameContext + useDeviceFrameContext
├── presets.ts                            # 内置设备预设（4 种设备）
├── composables/
│   ├── useDeviceFrame.ts                 # 消费设备状态的便捷 composable
│   └── index.ts
├── components/
│   ├── DeviceFrameShell.ts               # 自适应容器壳（根据注入状态切换设备）
│   ├── frames/
│   │   ├── IPhoneFrame.ts                # iPhone 容器（Dynamic Island 刘海）
│   │   ├── AndroidFrame.ts              # Android 手机容器（底部导航栏）
│   │   ├── TabletFrame.ts               # 平板容器
│   │   └── DesktopFrame.ts              # 桌面浏览器容器（交通灯 + URL 栏）
│   └── index.ts
├── toolbar/
│   ├── createDeviceToolbarRenderer.ts    # toolbar 设备切换器工厂
│   └── index.ts
├── styles/
│   ├── index.css                         # PostCSS 入口
│   ├── tokens.css                        # CSS 自定义属性
│   ├── device-frame.css                  # 公共基础样式
│   ├── iphone.css                        # iPhone 特有样式
│   ├── android.css                       # Android 特有样式
│   ├── tablet.css                        # 平板特有样式
│   └── desktop.css                       # 桌面浏览器特有样式
└── index.ts                              # 公共 API barrel export
```

## 核心概念

### 设备预设（DevicePreset）

每种设备由预设对象描述：

```ts
interface DevicePreset {
  type: DeviceType          // 'iphone' | 'android' | 'tablet' | 'desktop'
  label: string             // 显示名称
  icon: string              // 图标字符
  width: number             // 内容区宽度 (px)
  height: number            // 内容区高度 (px)
  frameComponent: Component // 对应的 Frame 组件
}
```

### 内置预设

| 设备 | type | 尺寸 | 视觉特征 |
|------|------|------|----------|
| iPhone | `iphone` | 375×812 | Dynamic Island 刘海 + 状态栏 + Home Indicator |
| Android | `android` | 360×800 | 状态栏 + 底部导航栏 (◁ ○ □) |
| Tablet | `tablet` | 768×1024 | 简洁状态栏 + 薄边框 |
| Desktop | `desktop` | 1280×800 | 浏览器标题栏（红黄绿交通灯 + URL 栏） |

### DeviceFrameContext（设备上下文）

通过 Vue provide/inject 管理设备状态：

```ts
interface DeviceFrameContext {
  currentDevice: Ref<DeviceType>                          // 当前设备类型
  presets: readonly DevicePreset[]                         // 所有可用预设
  getPreset: (type: DeviceType) => DevicePreset | undefined
  setDevice: (type: DeviceType) => void                   // 切换设备
}
```

### DeviceFrameShell（自适应容器壳）

稳定的组件引用，作为 `containerShell` 扩展点传入。内部通过 inject 获取 `DeviceFrameContext`，根据 `currentDevice` 渲染对应的 Frame 组件。组件引用不变，内部渲染随设备状态变化。

若未提供 context，自动降级为 iPhone 容器。

### 数据流

```
setup() → createDeviceFrameContext()
        → provide(DEVICE_FRAME_CONTEXT_KEY, ctx)

渲染链: DcDesigner → DcCanvas → RootRenderer → DeviceFrameShell
        DeviceFrameShell.setup() → inject(ctx)
                                 → computed(activeFrame = ctx.currentDevice → preset.frameComponent)

切换: toolbar 点击 → ctx.setDevice('android')
                   → activeFrame 重计算
                   → 渲染 AndroidFrame
```

## 组件详解

### Frame 组件

所有 Frame 组件遵循相同模式：
- `defineComponent` + render function
- 输出 BEM 类名 `dc-device-frame dc-device-frame--{device}`
- 内容区包含 `dc-container-shell` 类（renderer 识别用）
- 通过 `slots.default()` 传递子内容

### Toolbar 工厂

`createDeviceToolbarRenderer(ctx, options?)` 创建兼容 `DesignerExtensions.toolbarRenderer` 的函数：

```ts
// ctx 通过闭包捕获（因为 toolbarRenderer 在 render 函数中调用，inject 不可用）
const toolbarRenderer = createDeviceToolbarRenderer(deviceCtx, {
  includeUndoRedo: true, // 默认包含 undo/redo 按钮
})
```

## Composables

### useDeviceFrame()

在 `DeviceFrameContext` 后代中使用：

```ts
const {
  currentDevice,   // Ref<DeviceType>
  currentPreset,   // ComputedRef<DevicePreset>
  viewportWidth,   // ComputedRef<number>
  viewportHeight,  // ComputedRef<number>
  presets,         // readonly DevicePreset[]
  setDevice,       // (type: DeviceType) => void
} = useDeviceFrame()
```

## CSS 架构

### BEM 命名

- Block: `dc-device-frame`
- Elements: `__status-bar`, `__status-time`, `__status-icons`, `__notch`, `__content`, `__home-indicator`, `__nav-bar`, `__nav-btn`, `__title-bar`, `__traffic-lights`, `__traffic-dot`, `__url-bar`
- Modifiers: `--iphone`, `--android`, `--tablet`, `--desktop`, `--dynamic-island`, `--close`, `--minimize`, `--maximize`, `--home`

### CSS 自定义属性

```css
--dc-device-frame-border-color   /* 边框颜色 */
--dc-device-frame-border-width   /* 边框宽度 */
--dc-device-frame-bg             /* 背景色 */
--dc-device-frame-shadow         /* 阴影 */
--dc-device-frame-status-height  /* 状态栏高度 */
--dc-device-frame-titlebar-height /* 桌面标题栏高度 */
--dc-device-frame-nav-height     /* Android 导航栏高度 */
```

### 导入方式

```ts
import '@dragcraft/device-frames/styles'
```

## 与其他包协作

- **@dragcraft/renderer**：通过 `containerShell` 扩展点集成，DeviceFrameShell 作为画布容器壳。
- **@dragcraft/designer**：通过 `toolbarRenderer` 扩展点集成设备切换按钮。
- **@dragcraft/themes**：独立于主题系统，设备容器自包含 CSS。

## 约束

- 不依赖 `@dragcraft/designer` 或 `@dragcraft/renderer`（零 workspace 依赖）。
- toolbar 工厂使用最小 API 接口，避免硬依赖。
- 所有 Frame 组件的内容区必须包含 `dc-container-shell` 类。
