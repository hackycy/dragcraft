# UI Shell 与画布扩展

读取 [shell resources](resources/shell.json)，再区分主题、局部 renderer、Container Shell 与 Designer-owned Canvas Surface。

## 实施

1. 标准工作台加载 `@dragcraft/designer/standard.css`；完整自定义主题加载 `@dragcraft/designer/structure.css` 并补齐视觉 recipe。Device Frame 需要显式加载 `@dragcraft/device-frames/styles.css`。
2. 改标题或增加入口时使用 `materialItemRenderer`、`leftRailRenderer` 或 `rightRailRenderer`；这些局部扩展保留 Designer 的尺寸、搜索、disabled、拖拽和无障碍交互。
3. 只有产品需要完全不同的搜索、分组或属性编辑体验时才替换 `materialPanelRenderer`/`propertyPanelRenderer`，并由宿主接管选择、字段、空态、错误和 action 提交。
4. 宿主持有设备选择状态，将当前只读 Container Shell ref 传给 Designer extensions。
5. Container Shell 恰好渲染一次 default slot；Canvas Surface 继续拥有业务预览的滚动、裁剪和 headless 说明层。
6. 编辑器消息从公开 messages 覆盖入口提供，不依赖内部 class 或内部 package。

## 完成标准

切换设备或扩展后，root、regions、空态、选择和拖放反馈仍可用；document 与 history 未重建；主题与消息只依赖公开契约。
