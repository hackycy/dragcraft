# UI Shell 与画布扩展

读取 [shell resources](resources/shell.json)，再区分主题、局部扩展、Container Shell 与 Renderer-owned Canvas Surface。

## 实施

1. 颜色、密度和局部视觉使用公开主题 token 与 `data-dc-*` hook；完整自定义主题加载 `@dragcraft/designer/structure.css` 并补齐视觉 recipe。
2. 使用最窄 `extensions` 字段处理物料卡片、空态、节点包装、工具栏或 rail，保留 Designer 管理的交互和命令管线。
3. 设备选择状态由宿主持有；受控 `DevicePicker` 只发出 ID，解析后的 readonly Container Shell ref 传给 renderer extensions。
4. Container Shell 恰好渲染一次 default slot。Canvas Surface 继续拥有布局、选择平面、拖放反馈和 forbidden overlay。
5. 编辑器消息从公开 messages 覆盖入口提供，不依赖内部组件 class 或内部 package。

## 完成标准

切换设备或扩展后，flow、regions、chrome、layers、空态、选择和禁止提示仍可用；Designer、Schema 和 history 未重建；主题与消息只依赖公开契约。
