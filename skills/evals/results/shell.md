---
id: shell
workflows:
  - shell
status: passed
inputDigest: sha256:1c699ecb89b748dc89a5e2bc1df83268174908173eca55db014b08a679827a07
executedAt: "2026-07-31T08:53:19Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - Designer extensions、ContainerShellSource 与 device-frames 公开声明
  - 受控 DevicePicker、品牌 token、消息和物料卡片示例
  - 默认 Container Shell 的稳定几何、内部变量边界和 device-frames 样式入口
verification:
  - guide-project 类型检查与构建通过
  - 公开 package boundary 检查通过
  - 默认外壳尺寸、Designer 自适应高度和 Canvas Surface 内部滚动契约已覆盖
---

# 设备预览与工作台扩展

参考 Agent 只选择 shell。设备 ID 由宿主持有，readonly shell ref 在现有 Designer 上切换；物料卡片使用最窄扩展点，Container Shell 只渲染一次完整 Canvas Surface slot，主题和消息只依赖公开契约。
