---
description: "使用公开主题契约、设备 Frame 上下文和消息包定制工作台的视觉与语言。"
---

# 主题、设备与国际化

当工作台需要品牌视觉、设备预览或另一套编辑器文案时，设备 Frame 是 `containerShell` 扩展。示例在承载 Designer 和设备选择器的共同祖先中提供上下文：

<<< ../../../examples/guide-project/src/App.vue#tutorial-device-frame

随后将 `DeviceFrameShell` 传给 `rendererExtensions.containerShell`，并在宿主顶栏渲染 `DevicePicker`。不渲染选择器时，Designer 不会自行添加设备控制。

主题先导入 `@dragcraft/themes`。日常品牌调整使用公开 CSS token；只有 token 无法表达的局部视觉才使用 `data-dc-component`、`data-dc-part` 和 `data-dc-state`。

```css
:root {
  --dc-color-accent: #0f766e;
  --dc-radius-md: 8px;
}
```

| 框架负责 | 宿主负责 |
| --- | --- |
| 结构 CSS、默认 recipe、设备壳和编辑器消息解析 | 品牌主题、画布内业务主题、设备选择位置和业务语言包 |

不要依赖 `.dc-*` 私有 class，也不要省略 `@dragcraft/themes/structure` 后再实现完整自定义视觉。语言包通过 `createDesigner({ locale, messages })` 合并，业务页面正文仍由你的应用翻译。

**完成检查**：切换 DevicePicker 后画布使用对应 viewport；品牌覆盖只使用 token 或公开 data hook；编辑器消息与业务正文分别由各自的消息系统提供。

下一步：[生命周期与运行时](/guide/customization/lifecycle-and-runtime)。查看 [主题与 utils](/reference/themes-and-utils) 和 [device frames](/reference/device-frames) 的完整入口。
