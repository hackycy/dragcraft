# 主题与设备框架

dragcraft 的 UI 包只输出稳定的 `dc-*` class。你可以直接导入一套皮肤，也可以让业务 CSS 完全接管视觉。

先使用内置主题：

```ts
import '@dragcraft/themes'
```

这会为设计器、画布、物料栏和属性表单加载紧凑、中性的 shadcn 主题。`@dragcraft/themes/shadcn` 是同一个显式入口。

## 选择 shadcn 或 Material

两套主题都覆盖相同的 `dc-*` class 和语义令牌。

- 默认的 shadcn 适合信息密度较高的工作台。
- 偏好 Google Material 3 的色彩角色、圆角和控件密度时，改为导入：

```ts
import '@dragcraft/themes/material'
```

主题不依赖 Ant Design Vue。只有在使用 `@dragcraft/fields-ant-design-vue` 时，才在应用入口额外导入 `ant-design-vue/dist/reset.css`；字段接入方式见[配置表单与字段](/guide/forms-and-fields)。

## 覆盖主题而不改组件逻辑

主题通过 CSS variables 和语义化 class 组织，因此业务样式可以在主题之后覆盖：

```css
/* app.css，在主题入口之后导入 */
.dc-designer {
  --dc-color-accent: #0f766e;
  --dc-color-accent-hover: #115e59;
  --dc-color-surface: #ffffff;
  --dc-radius-md: 8px;
  --dc-workspace-left-width: 280px;
  --dc-workspace-right-width: 320px;
}

.dc-material-item {
  border-radius: 4px;
}
```

颜色、排版、形状、阴影、密度和动效都通过语义令牌进入组件。覆盖变量适合统一调整品牌与产品密度；覆盖 `dc-*` class 适合调整局部组件结构。若要完全无头集成，不导入 `@dragcraft/themes`，而是为需要的 class 编写完整样式。

## 节点轮廓由 renderer 控制

画布节点未选中时悬浮显示虚线，选中后显示实线。renderer 会按可见边界计算安全绘制区域，因此主题只需要通过 `--dc-color-accent` 调整轮廓颜色。

不要覆盖 `.dc-node__block-overlay` 的线型、线宽或几何位置；这些交互约束保证节点贴近设备或滚动边界时，四边轮廓仍能稳定显示。

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
