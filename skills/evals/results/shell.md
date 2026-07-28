---
id: shell
workflow: shell
status: passed
evidence:
  - dragcraft shell playbook
  - 主题/设备框指南、Renderer 类型、Device Frame Definitions 和宿主示例
verification:
  - Renderer、Designer 与 device-frames package tests
  - playground 与 guide-project production builds
  - skills:check 与 skills:test
---

# Shell 结果

实现保留 Designer 的拖拽、选中、命令和放置校验；Active Device Frame 由宿主持有，受控 Picker 只发出 ID 请求，readonly Container Shell ref 负责响应式切换。Container Shell 只渲染一次 default slot，Canvas Surface、三种选择平面与禁止层继续由 Renderer 拥有。package tests 和两个宿主构建通过。
