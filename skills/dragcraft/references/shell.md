# UI Shell 与画布扩展

## 证据链

读取动作与视图扩展、主题与设备框架指南，再检查 Renderer extension 类型和现有 DeviceFrameShell。确定目标属于主题、单一视觉部件、面板替换还是完整画布 Shell。

## 实施

1. 颜色、密度与局部视觉优先使用主题 token 和公开 `data-dc-*` hook；完整自定义主题先加载 `@dragcraft/themes/structure`。
2. 使用最窄的 `extensions` 字段处理物料卡片、空态、节点包裹层、工具栏、选择投影或 rail；保留 Designer 管理的交互和命令管线。
3. 用 `customActions` 返回 Schema command，用 `actionInterceptors` 处理确认、权限、审计和错误，用 `eventHooks` 监听画布交互。
4. 编写 `containerShell` 时渲染内容流、chrome、layer 和禁止放置提示，并通过 `selectionPresentation.registerPlane()` 注册 root、content、viewport 平面。

## 完成

确认选中、拖拽、布局分区、overflow 裁剪和禁止放置提示在目标 Shell 中可见。验证响应式工作区与设备框中的选择投影。
