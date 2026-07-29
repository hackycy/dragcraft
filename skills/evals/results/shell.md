---
id: shell
workflows:
  - shell
status: passed
inputDigest: sha256:ce2a4b1fdbdecdc853f09fe9d91da9d51c8b01f71f497a0a67f56c35b4ee7811
executedAt: "2026-07-29T10:57:11Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - Designer extensions、ContainerShellSource 与 device-frames 公开声明
  - 受控 DevicePicker、品牌 token、消息和物料卡片示例
verification:
  - guide-project 类型检查与构建通过
  - 公开 package boundary 检查通过
---

# 设备预览与工作台扩展

参考 Agent 只选择 shell。设备 ID 由宿主持有，readonly shell ref 在现有 Designer 上切换；物料卡片使用最窄扩展点，Container Shell 只渲染一次完整 Canvas Surface slot，主题和消息只依赖公开契约。
