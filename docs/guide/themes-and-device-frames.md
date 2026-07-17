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

主题不依赖 Ant Design Vue。只有在使用 `@dragcraft/fields-ant-design-vue` 时，才在应用入口额外导入 `ant-design-vue/dist/reset.css`；字段接入方式见[配置表单与字段](/guide/forms-and-fields)。

## 覆盖主题而不改组件逻辑

主题通过全局语义 token、少量组件 token 和精选 component/part/state hook 组织。普通品牌主题只需在主题入口之后覆盖差异：

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

主题不使用零 specificity 技巧，也不使用 `!important` 或内部 `.dc-*` class。常规定制优先覆盖 token；只有 token 无法表达时才覆盖公开 hook。结构 CSS 先加载并用私有 class 预留必要几何，主题 recipe 随后声明视觉，因此维护者只需要遵守公开 selector 和导入顺序。

Material Group 与 Form Section 的 `header`、`title`、`toggle` 使用同一份基线配方。品牌主题调整折叠标题时应同时覆盖两个 component，避免物料栏和属性表单产生两套交互反馈：

```css
[data-dc-component="material-group"] > [data-dc-part="header"]:hover,
[data-dc-component="form-section"] > [data-dc-part="header"]:hover {
  background: var(--dc-color-surface-muted);
}
```

## selected 投影与视觉分离

hover 不绘制范围轮廓；节点 selected 后，Renderer 计算完整投影，Device Frame 的内容/视口平面负责原生滚动和 overflow 裁剪，默认 `nodeSelection` presenter 绘制连续实线矩形。root-owned 投影不会收缩到安全区内：上下边位于物料外侧，左右边覆盖 Frame 边框；container-owned 投影保持 wrapper border box。

通过 `--dc-color-accent` 和 `--dc-node-selection-stroke-width` 调整默认 presenter；自定义 Frame 通过 `--dc-node-selection-root-inline-overlap` 声明根级左右边需要覆盖的宽度，并通过 `--dc-node-selection-root-block-overlap` 统一上下边线与 chrome/content 间的留白。需要其他视觉形式时替换 `rendererExtensions.nodeSelection`，不要覆盖 Renderer 私有投影容器的位置和尺寸。自定义 `containerShell` 可以使用传入的 `selectionPresentation.registerPlane()` 注册自己的内容与视口平面；未注册时 Renderer 使用矩形 fallback plane。

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

不渲染 `DevicePicker` 时不会出现设备选择。Designer 画布只保留撤销、重做、指针、抓手和重置位置；frame 会以外框中心对齐画布中心，并通过独立 stage 支持无滚动边界的二维拖动。

关于视觉层，目前知道这些就够了。准备好之后，继续阅读 [编辑器国际化](/guide/i18n)。
