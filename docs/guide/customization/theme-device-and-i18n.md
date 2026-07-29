---
description: "使用公开主题契约、宿主持有的 Device Frame 选择和消息包定制编辑工作台。"
---

# 主题、设备与国际化

工作台主题、设备预览和业务页面主题是三件不同的事。Designer 的主题只负责编辑器界面；页面内业务组件仍由你的应用样式化；设备选择由宿主状态控制。

设备外壳不是核心编辑器的前置依赖。只有需要设备选择时才安装它：

```bash
pnpm add @dragcraft/device-frames@^0.0.4
```

## 让宿主持有设备选择

活动页把当前设备 ID、定义解析和 Shell ref 放在宿主 composable 中：

`src/host/use-device-frame.ts`：

<<< ../../../examples/guide-project/src/host/use-device-frame.ts

`DevicePicker` 只发出请求的 ID。宿主可以接受、拒绝或映射该 ID，再把 `activeContainerShell` 交给 Designer。切换 Shell 不会重建 Engine、Schema 或 history，但不保证保留 Shell 内滚动位置和物料局部状态。

## 使用公开主题契约

入口先加载 Standard 主题：

```ts
import '@dragcraft/designer/styles'
import '@dragcraft/device-frames/styles'
```

日常品牌调整覆盖公开 token：

```css
:root {
  --dc-color-accent: #0f766e;
  --dc-radius-md: 8px;
}
```

只有 token 无法表达的局部视觉才使用 `data-dc-component`、`data-dc-part` 和 `data-dc-state`。不要依赖 `.dc-*` 私有 class。完全自定义视觉时才改为导入 `@dragcraft/designer/styles/structure`，并负责补齐主题契约中的 token 和视觉配方。

## 分开处理编辑器和业务文案

`createDesigner({ locale, messages })` 合并的是编辑器自身的消息，例如面板和动作标签。业务页面正文、公告内容和服务端错误仍由宿主的国际化系统处理。

**完成检查**：切换 `DevicePicker` 后画布使用对应 viewport 且 Schema/history 保持不变；品牌覆盖只使用 token 或公开 data hook；编辑器消息与业务正文分别由各自的消息系统提供。

下一步：[生命周期与运行时](/guide/customization/lifecycle-and-runtime)。查看 [样式与国际化](/reference/designer-styles) 和 [device frames](/reference/device-frames) 的精确入口；Device Frame 的受控选择边界见 [Architecture Map 的宿主持有选择](https://github.com/hackycy/dragcraft/blob/main/.github/architecture/06-themes-and-device-frames.md#宿主持有选择)。
