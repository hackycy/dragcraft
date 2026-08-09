# UI Shell 与画布扩展

读取 [shell resources](resources/shell.json)，再区分主题、局部扩展、Container Shell 与 Designer-owned Canvas Surface。

## 实施

1. 标准工作台加载 `@dragcraft/designer/standard.css`；完整自定义主题加载 `@dragcraft/designer/structure.css` 并补齐视觉 recipe。Device Frame 需要显式加载 `@dragcraft/device-frames/styles.css`。
2. 使用最窄 `extensions` 字段处理物料卡片、空态、节点包装、工具栏或 rail，保留 Designer 管理的交互。
3. 宿主持有设备选择状态，将当前只读 Container Shell ref 传给 Designer extensions。
4. Container Shell 恰好渲染一次 default slot；Canvas Surface 继续拥有业务预览的滚动、裁剪和 headless 说明层。
5. 编辑器消息从公开 messages 覆盖入口提供，不依赖内部 class 或内部 package。

## 完成标准

切换设备或扩展后，root、regions、空态、选择和拖放反馈仍可用；document 与 history 未重建；主题与消息只依赖公开契约。
