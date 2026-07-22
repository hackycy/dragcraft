---
id: shell
workflow: shell
task: 在设计器中接入设备预览，调整物料卡片视觉，并保留拖拽、选中和禁止放置提示。
evidence:
  - extensions 和 Renderer 类型
  - 主题与设备框指南、DeviceFrameShell 范例
boundary:
  - 局部视觉使用最窄 extensions 字段
  - 完整 shell 渲染 content、chrome、layer 和提示层，并注册选择平面
verification:
  - 验证设备框内选中和拖放反馈
  - 验证响应式工作区保持可用
---

# 设备预览与局部视觉
