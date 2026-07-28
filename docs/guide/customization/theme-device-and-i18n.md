---
description: "使用公开主题契约、宿主持有的 Device Frame 选择和消息包定制工作台的视觉与语言。"
---

# 主题、设备与国际化

当工作台需要品牌视觉、设备预览或另一套编辑器文案时，Device Frame Definition 提供 `containerShell` adapter。示例由宿主持有 Active Device Frame ID，并把当前 definition 的 Container Shell readonly ref 传给 Designer：

<<< ../../../examples/guide-project/src/App.vue#tutorial-device-frame

`DevicePicker` 接收只读 definitions 与当前 ID，只发出 `update:modelValue`；宿主决定是否更新状态。不渲染选择器时，Designer 不会自行添加设备控制。切换 Container Shell 不会重建 Designer、Engine、Schema 或 history。

工作台先导入 `@dragcraft/designer/styles` 加载 Standard 主题。日常品牌调整使用公开 CSS token；只有 token 无法表达的局部视觉才使用 `data-dc-component`、`data-dc-part` 和 `data-dc-state`。

```css
:root {
  --dc-color-accent: #0f766e;
  --dc-radius-md: 8px;
}
```

| 框架负责 | 宿主负责 |
| --- | --- |
| 结构 CSS、默认 recipe、Canvas Surface、设备外壳 adapters 和编辑器消息解析 | 品牌主题、画布内业务主题、Active Device Frame、选择器位置和业务语言包 |

不要依赖 `.dc-*` 私有 class。只有完全自定义视觉时才改为导入 `@dragcraft/designer/styles/structure`，并负责补齐主题契约中的全部 token 和视觉 recipe。语言包通过 `createDesigner({ locale, messages })` 合并，业务页面正文仍由你的应用翻译。

**完成检查**：切换 DevicePicker 后画布使用对应 viewport 且 Schema/history 保持不变；品牌覆盖只使用 token 或公开 data hook；编辑器消息与业务正文分别由各自的消息系统提供。

下一步：[生命周期与运行时](/guide/customization/lifecycle-and-runtime)。查看 [Designer 样式与国际化](/reference/designer-styles) 和 [device frames](/reference/device-frames) 的完整入口。
