---
description: "在 Vue 应用中接入 DragCraft 的主题、设备预览和工作台国际化。"
---

# 主题、设备与国际化

这篇指南面向已经完成 [创建可运行编辑器](/guide/learn/first-editor) 的 Vue 应用。你将按下面的顺序完成三项互不耦合的定制：

1. 用公开 token 覆盖工作台品牌样式。
2. 安装可选的 Device Frame 包，并把固定或可切换的设备预览传给 `DcDesigner`。
3. 设置工作台语言，并为 `DevicePicker` 提供同一套翻译函数。

主题只影响工作台，Device Frame 只包裹设计态 Canvas，消息包只影响编辑器 UI。业务页面内容和生产 Runtime 仍由宿主应用负责。

## 前置条件

先确认应用已经安装并使用 `@dragcraft/designer`、字段 adapter、Vue 和对应 UI 库。最小安装命令见 [5 分钟跑通](/guide/learn/quickstart#安装公开依赖)。

设备预览不是 Designer 的内置依赖。需要设备外壳或 `DevicePicker` 时，额外安装公开包：

```bash
pnpm add @dragcraft/device-frames
```

`@dragcraft/device-frames` 依赖 Vue 的 peer dependency；已经按最小接入安装 Vue 的应用不需要再安装其他设备包。业务应用只直接导入 [公开接入边界](/guide/#公开接入边界) 中列出的包。

## 先加载样式

在应用入口按以下顺序加载样式：

```ts
import '@dragcraft/designer/standard.css'
import '@dragcraft/device-frames/styles.css' // 仅在使用 Device Frame 时需要
import './brand-theme.css'
```

`@dragcraft/device-frames/styles.css` 不会随 JavaScript 入口自动加载；漏掉它时，设备外壳会有结构但没有公开外观。使用 `standard.css` 时应先加载 Designer 主题，再加载设备外壳样式，最后加载应用自己的覆盖。

如果应用准备实现整套工作台视觉，可以把 `standard.css` 换成 `structure.css`，但必须自行补齐所有视觉 recipe 和主题契约。大多数品牌定制只需要 Standard 主题和少量 token 覆盖。完整入口见 [样式与国际化参考](/reference/designer-styles)。

## 覆盖公开主题 token

只在应用自己的 CSS 中覆盖公开 token：

<<< ../../../examples/guide-project/src/brand-theme.css

token 适合颜色、字号、圆角、密度、阴影和动效。只有 token 无法表达局部视觉时，才使用公开的 `data-dc-component`、`data-dc-part` 和 `data-dc-state` hook。

不要依赖私有 `.dc-*` class、选择器顺序或 `!important`。这些是实现细节，可能在不改变公共主题契约的情况下调整。

画布内业务物料的 CSS 不属于 Designer 主题。请在业务样式中维护物料外观以及设计态和生产 Runtime 之间的映射。

## 接入设备预览

### 只使用一个固定设备

只想让画布以一个设备尺寸展示时，不需要 `DevicePicker`。导入一个 definition，并直接传给 `DcDesigner`：

```ts
import { DcDesigner } from '@dragcraft/designer'
import { IPHONE_DEVICE_FRAME } from '@dragcraft/device-frames'
```

```vue
<DcDesigner
  :instance="designer"
  :device-frame="IPHONE_DEVICE_FRAME"
/>
```

definition 是只读的设备目录项，包含 viewport 和 Container Shell。它只改变设计态画布外壳，不改变 Schema、页面数据或撤销历史。

### 允许用户切换设备

需要下拉选择时，使用 `DevicePicker`。它是受控组件：选择状态保存在宿主，事件只返回请求的设备 ID。下面的代码可以直接放进持有 `designer` 实例的 Vue 组件：

```vue
<script setup lang="ts">
import { DcDesigner } from '@dragcraft/designer'
import {
  BUILT_IN_DEVICE_FRAMES,
  DevicePicker,
  IPHONE_DEVICE_FRAME,
} from '@dragcraft/device-frames'
import { computed, ref } from 'vue'

const activeDeviceFrameId = ref(IPHONE_DEVICE_FRAME.id)
const activeDeviceFrame = computed(() =>
  BUILT_IN_DEVICE_FRAMES.find(item => item.id === activeDeviceFrameId.value)
  ?? IPHONE_DEVICE_FRAME,
)

function selectDeviceFrame(id: string) {
  if (BUILT_IN_DEVICE_FRAMES.some(item => item.id === id))
    activeDeviceFrameId.value = id
}
</script>

<template>
  <DevicePicker
    :definitions="BUILT_IN_DEVICE_FRAMES"
    :model-value="activeDeviceFrameId"
    @update:model-value="selectDeviceFrame"
  />
  <DcDesigner :instance="designer" :device-frame="activeDeviceFrame" />
</template>
```

`DevicePicker` 不保存选择，也不会自行解析 definition。宿主可以在回调中拒绝不允许的 ID、映射到自定义目录，或更新自己的路由状态。把新的 `activeDeviceFrame` 传回 `DcDesigner` 后，现有实例会切换外壳；document 和 history 不会重建。

内置设备、`DeviceFrameDefinition` 和自定义 Container Shell 的完整契约见 [Device Frames 参考](/reference/device-frames)。Device Frame 只模拟设计态 viewport 和系统 UI；生产页面必须由宿主 Runtime 根据目标平台处理真实安全区、导航和窗口尺寸。

## 设置工作台语言

`createDesigner` 的 `locale` 默认是 `zh-CN`。通过 `messages` 传入的消息会合并到 Designer 和 Presentation 的默认消息树中，未覆盖的键继续使用默认文本：

```ts
import { createDesigner } from '@dragcraft/designer'
import { guideMessages } from './editor/messages'

const designer = createDesigner({
  schema,
  materials,
  locale: 'zh-CN',
  messages: guideMessages,
})
```

需要在运行时切换工作台语言时，调用实例的 `setLocale`：

```ts
designer.setLocale('en')
```

示例仓库的 `messages.ts` 只覆盖业务需要变化的消息键：

<<< ../../../examples/guide-project/src/editor/messages.ts

`messages` 只负责编辑器 UI。页面正文、物料 props 和生产 Runtime 的语言状态应由业务应用单独管理，不要把活动内容文案塞进 Designer messages。

### 给 DevicePicker 提供翻译

`DevicePicker` 位于 `DcDesigner` 外部，不会自动注入 Designer 的 i18n 上下文。需要显示设备分组、设备名称和控件标签时，在宿主创建一个 i18n 实例并传入 `translate`：

```ts
import { createI18n, designerMessages } from '@dragcraft/designer'

const hostI18n = createI18n('zh-CN', designerMessages)

function setLocale(locale: string) {
  designer.setLocale(locale)
  hostI18n.setLocale(locale)
}
```

```vue
<DevicePicker
  :definitions="BUILT_IN_DEVICE_FRAMES"
  :model-value="activeDeviceFrameId"
  :translate="hostI18n.t"
  @update:model-value="selectDeviceFrame"
/>
```

如果使用自定义 locale，分别为 `createDesigner({ messages })` 和 `createI18n().mergeMessages()` 提供该 locale 的消息；否则组件会使用传入的 fallback 或消息键。

## 验证结果

- 应用入口已安装并导入 `@dragcraft/device-frames/styles.css`，设备外壳显示完整样式。
- 固定设备模式能渲染 `DcDesigner`；可切换模式的 `DevicePicker` 能更新外壳。
- 切换设备后，`designer.document`、页面数据和撤销/重做历史保持不变。
- 修改 token 后只有工作台品牌样式变化，画布内业务物料仍由业务 CSS 控制。
- 调用 `setLocale` 后工作台消息和 `DevicePicker` 标签同步更新，业务正文保持自己的语言状态。
