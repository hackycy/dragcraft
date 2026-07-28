# Dragcraft

Dragcraft 是可视化页面设计上下文，区分页面内容编排与设计器中承载页面预览的外部呈现。

## Rendering And Device Frames

**Canvas Surface**:
页面在设计态中的完整呈现，包括页面布局分区和交互平面。Canvas Surface 被放置在 Container Shell 内部。
_Avoid_: Frame content、device body

**Container Shell**:
包围 Canvas Surface 的可替换视觉外壳。它定义 viewport 几何与外围外观，不拥有页面布局分区或 Frame 选择状态。
_Avoid_: Canvas renderer、layout container

**Device Frame Definition**:
一个可用设备外形 Container Shell 的稳定、无状态描述，包含身份、展示元数据与 viewport 几何。
_Avoid_: Device preset、device context、device controller

**Active Device Frame**:
宿主为一个 Designer 实例当前选择的 Device Frame Definition。
_Avoid_: Current device context、active preset

**Host**:
集成并承载 Designer 的业务应用。Host 拥有 Active Device Frame、选择策略与产品级持久化。
_Avoid_: Device frame controller、device context owner
