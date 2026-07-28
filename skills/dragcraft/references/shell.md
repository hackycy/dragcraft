# UI Shell 与画布扩展

## 证据链

读取动作与视图扩展、主题与 Device Frame 指南，再检查 `RendererExtensions.containerShell`、`DeviceFrameDefinition` 和宿主示例。先区分工作台主题、局部视觉、面板替换、Container Shell 与 Renderer-owned Canvas Surface。

## 实施

1. 颜色、密度与局部视觉优先使用主题 token 和公开 `data-dc-*` hook；完整自定义主题先加载 `@dragcraft/designer/styles/structure`。
2. 使用最窄的 `extensions` 字段处理物料卡片、空态、节点包裹层、工具栏、选择投影或 rail；保留 Designer 管理的交互和命令管线。
3. 用 `customActions` 返回 Schema command，用 `actionInterceptors` 处理确认、权限、审计和错误，用 `eventHooks` 监听画布交互。
4. 设备切换由宿主持有 Active Device Frame ID。根据 definitions 解析当前 definition，把 `computed(() => definition.containerShell)` 传给 `rendererExtensions.containerShell`，并把 `DevicePicker` 作为只发出 `update:modelValue` 的受控视图。
5. 自定义 `containerShell` 不接收 Renderer props，只恰好渲染一次 default slot。不要在 Shell 中读取 Schema、解释 LayoutPlan、渲染 flow/chrome/layer、注册 selection planes 或处理 forbidden overlay；这些职责属于 Renderer-owned Canvas Surface 与稳定 Frame Boundary。

## 完成

确认静态 Shell 与 readonly reactive Shell ref 都可用。切换后 flow、regions、Schema chrome、layers、空态、选择投影和禁止放置提示仍可见，Designer、Engine、Schema 与 history 未重建，画布 pan 已回到中心。验证自定义 definition 使用开放字符串 ID，并能与内置 definitions 一起进入受控 Picker。
