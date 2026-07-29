---
id: shell
workflows:
  - shell
task: 接入受控设备预览、品牌 token、消息覆盖和物料卡片扩展，同时保留完整画布交互。
evidence:
  - extensions、主题契约和 Device Frame 公开类型
  - shell resources 与宿主示例
boundary:
  - 局部视觉使用最窄扩展点和公开 token
  - Container Shell 只渲染一次完整 Canvas Surface slot
verification:
  - 切换设备后 Designer、Schema 和 history 未重建
  - flow、regions、chrome、layers、选择和禁止提示仍可用
  - 宿主构建通过且没有内部 package 导入
---

# 设备预览与工作台扩展
