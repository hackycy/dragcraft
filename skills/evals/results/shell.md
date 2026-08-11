---
id: shell
workflows:
  - shell
status: passed
inputDigest: sha256:b15082b2b2c5e96de22e8f02d7a8e4c4fedd29dbdd8864c9006790e2e757c3fa
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - Designer extensions、ContainerShellSource 与 Device Frame 的公开声明
  - 受控 DevicePicker、品牌 token、消息和物料卡片示例
  - 默认 Container Shell 几何、Canvas Surface 边界和 Device Frame 样式入口
verification:
  - Guide Project 的两项 Device Frame browser 断言通过
  - 公开 package boundary 检查与默认 Shell 几何测试已覆盖
---

# 设备预览与工作台扩展

参考 Agent 只选择 shell。设备 ID 由宿主持有，readonly shell ref 在现有 Designer 上切换；物料卡片使用最窄扩展点，Container Shell 只渲染一次完整 Canvas Surface slot，主题和消息只依赖公开契约。
