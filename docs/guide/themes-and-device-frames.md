---
description: "选择和定制 dragcraft 工作台主题、结构 CSS、公开样式契约与设备预览框架。"
---

# 主题与设备框架

dragcraft 的 UI 是可主题化 Shell：组件包拥有必要结构样式，`@dragcraft/themes` 提供完整默认 token、共享视觉配方和 Material 差异。内部 `dc-*` class 不属于主题 API。

先使用内置主题：

```ts
import '@dragcraft/themes'
```

这会一次加载 Designer、Renderer 和 Form Generator 的结构样式，以及紧凑、企业蓝调的 Standard 工作台主题。`@dragcraft/themes/standard` 是同一个显式入口。

## 选择 Standard 或 Material

两套主题共享同一份结构样式、公共主题契约和基线视觉配方。

- 默认的 Standard 使用企业蓝主色，适合信息密度较高的工作台。
- 偏好 Google Material 3 的色彩角色、圆角和控件密度时，改为导入：

```ts
import '@dragcraft/themes/material'
```

主题不依赖 Ant Design Vue。只有在使用 `@dragcraft/fields-ant-design-vue` 时，才在应用入口额外导入 `ant-design-vue/dist/reset.css`；字段接入方式见 [配置表单与字段](/guide/forms-and-fields)。

## 覆盖主题而不改组件逻辑

主题通过全局语义 token、少量组件 token 和精选 component/part/state hook 组织。普通品牌主题在主题入口之后覆盖差异：

```css
/* app.css，在主题入口之后导入 */
:root {
  --dc-color-accent: #0f766e;
  --dc-color-accent-hover: #115e59;
  --dc-color-surface: #ffffff;
  --dc-radius-md: 8px;
}

[data-dc-component="material-item"] {
  border-radius: 4px;
}
```

颜色、排版、形状、阴影、密度和动效都优先通过 token 进入组件；只有 token 无法表达的局部视觉才使用公开 hook。完整清单见 `@dragcraft/themes/theme-contract.json`，编辑器补全数据见 `@dragcraft/themes/css-custom-data.json`。

工作台宽度与响应式断点属于产品布局配置，而不是主题：

```ts
const designer = createDesigner({
  workspace: {
    compactBreakpoint: 1080,
    leftPanelWidth: 260,
    rightPanelWidth: 340,
  },
})
```

需要完全重画工作台时，先导入 `@dragcraft/themes/structure`，再按 manifest 实现自己的完整视觉配方。结构 CSS 是 `DcDesigner` 正常工作的必要依赖，不能省略。

工作台主题不会为画布内业务物料提供按钮、文本、表单等内容样式；这些样式由宿主内容主题负责。

## 编写可覆盖的 recipe

recipe 从公开的 `data-dc-component` 开始，需要定位内部视觉区域时再追加 `data-dc-part`。覆盖已有 recipe 时复用相同 selector，并把业务样式放在主题入口之后：

```css
[data-dc-component="node-toolbar"] > [data-dc-part="action"] {
  color: var(--dc-color-on-accent);
  background: var(--dc-color-accent);
}
```

主题不使用零 specificity 技巧，也不使用 `!important` 或内部 `.dc-*` class。常规定制优先覆盖 token；只有 token 无法表达时才覆盖公开 hook。结构 CSS 先加载并用私有 class 预留必要几何，主题 recipe 随后声明视觉，因此维护者应遵守公开 selector 和导入顺序。

Material Group 与 Form Section 的 `header`、`title`、`toggle` 使用同一份基线配方。品牌主题调整折叠标题时应同时覆盖两个 component，避免物料栏和属性表单产生两套交互反馈：

```css
[data-dc-component="material-group"] > [data-dc-part="header"]:hover,
[data-dc-component="form-section"] > [data-dc-part="header"]:hover {
  background: var(--dc-color-surface-muted);
}
```

## selected 投影与视觉分离

hover 不绘制范围轮廓；节点 selected 后，Renderer 同时计算物料真实范围和选择语义范围。root-owned 节点进入覆盖完整 Device Frame 的 root 平面：上下边位于物料外侧，左右边占用 Frame 边框带，所以选框横向跟随 Frame、纵向包住物料。container-owned 节点进入所属子树的内容或视口平面，选框严格跟随自身 wrapper border box。各平面负责原生滚动和 overflow 裁剪。

通过 `--dc-color-accent` 和 `--dc-node-selection-stroke-width` 调整默认 presenter；自定义 Frame 通过 `--dc-node-selection-root-inline-overlap` 声明两侧边框带中的边线宽度，通过 `--dc-node-selection-root-block-overlap` 声明物料上下边界外侧的边线厚度。这两个属性只控制 presenter，不得给 flow、chrome 或 layer 物料增加布局留白。需要其他视觉形式时替换 `rendererExtensions.nodeSelection`，不要覆盖 Renderer 私有投影容器的位置和尺寸。自定义 `containerShell` 使用传入的 `selectionPresentation.registerPlane()` 注册 `root`、`content` 和 `viewport` 三个平面；未注册的平面由 Renderer 使用矩形 fallback plane。

## 在画布中接入设备预览

设备框架是 renderer 的 `containerShell` 扩展，不属于业务物料：

```ts
import '@dragcraft/device-frames/styles'
import {
  createDeviceFrameContext,
  DEVICE_FRAME_CONTEXT_KEY,
  DeviceFrameShell,
  DevicePicker,
} from '@dragcraft/device-frames'
import { provide } from 'vue'

const deviceCtx = createDeviceFrameContext({ initialDevice: 'iphone' })
provide(DEVICE_FRAME_CONTEXT_KEY, deviceCtx)

const designer = createDesigner({
  widgetMetas,
  componentMap,
  extensions: {
    rendererExtensions: { containerShell: DeviceFrameShell },
  },
})
```

`DeviceFrameShell` 接收 renderer 已经分好的内容流、chrome 和浮层节点。设备选择由宿主单独渲染，Playground 把它放在应用顶栏：

```vue
<DevicePicker :context="deviceCtx" :translate="designer.i18n.t" />
<DcDesigner :instance="designer" />
```

不渲染 `DevicePicker` 时不会出现设备选择。使用 `DeviceFrameShell` 时，Designer 会在设备壳首次可测量时和切换设备后自动适配画布，并为壳体四周保留 32px 安全边距；不会因为浏览器窗口或面板尺寸变化覆盖当前的手动缩放。

设备壳出现后，画布工具栏会增加缩小、当前百分比、放大、适配画布和居中。手动缩放以 10% 为步进，范围是 10% 到 200%；自动适配可以低于 10%，确保完整设备壳可见。`适配画布` 会同时重置平移并重新计算缩放，`居中` 只重置平移，抓手仍可在任意缩放下按屏幕像素自由拖动。普通 `containerShell` 不显示缩放控件，继续使用原有的居中与抓手行为。

需要为物料标题、字段标签和编辑器操作提供多语言文案时，继续阅读 [编辑器国际化](/guide/i18n)。
