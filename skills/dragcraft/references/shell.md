# UI Shell 与画布扩展

读取 [shell resources](resources/shell.json)，再区分主题、局部扩展、Container Shell 与 Renderer-owned Canvas Surface。

## 实施

1. 标准工作台加载 `@dragcraft/designer/standard.css`；完整自定义主题加载 `@dragcraft/designer/structure.css` 并补齐视觉 recipe。使用 Device Frame 时还必须显式加载 `@dragcraft/device-frames/styles.css`，这些 CSS 入口都不会由 JavaScript 入口自动加载。
2. 使用最窄 `extensions` 字段处理物料卡片、空态、节点包装、工具栏或 rail，保留 Designer 管理的交互和命令管线。
3. 设备选择状态由宿主持有；受控 `DevicePicker` 只发出 ID，解析后的 readonly Container Shell ref 传给 renderer extensions。未传 `containerShell` 时使用无设备默认外壳：宽度 `375px`、独立渲染高度 `667px`、最小高度 `480px`；Designer 会按可用画布高度调整它，内容在 Canvas Surface 内滚动。该内部几何变量不是宿主或自定义 Shell 的 API。
4. Container Shell 恰好渲染一次 default slot。Canvas Surface 继续拥有布局、选择平面、拖放反馈和 forbidden overlay。
5. 编辑器消息从公开 messages 覆盖入口提供，不依赖内部组件 class 或内部 package。

## 完成标准

切换设备或扩展后，flow、regions、chrome、layers、空态、选择和禁止提示仍可用；Designer、Schema 和 history 未重建；主题与消息只依赖公开契约。
