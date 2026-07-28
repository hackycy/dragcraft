---
id: shell
workflow: shell
task: 在设计器中接入设备预览，调整物料卡片视觉，并保留拖拽、选中和禁止放置提示。
evidence:
  - extensions 和 Renderer 类型
  - 主题与设备框指南、Device Frame Definitions 和宿主持有选择范例
boundary:
  - 局部视觉使用最窄 extensions 字段
  - Container Shell 只渲染一次完整 Canvas Surface slot，不接收 Renderer 布局职责
verification:
  - 验证宿主切换后设备框内选中、布局和拖放反馈
  - 验证 Designer、Schema、history 与响应式工作区保持可用
---

# 设备预览与局部视觉
