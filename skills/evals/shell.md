---
id: shell
workflows:
  - shell
task: 接入受控设备预览、品牌 token、消息覆盖和物料卡片扩展，同时保留完整画布交互。
evidence:
  - extensions、主题契约和 Device Frame 公开类型
  - shell resources 与宿主示例
  - DefaultContainerShell 的默认几何和 Designer Presentation-owned 内部变量约束
boundary:
  - 局部视觉使用最窄扩展点和公开 token
  - Container Shell 只渲染一次完整 Canvas Surface slot
  - 默认外壳的内部几何不是宿主或自定义 Shell 的扩展协议
verification:
  - 切换设备后 Designer、Schema 和 history 未重建
  - flow、regions、chrome、layers、选择和禁止提示仍可用
  - 未传 `containerShell` 时默认外壳为 375px 宽、667px 默认高、最小 480px，Designer 高度随画布变化且内容在 Canvas Surface 内滚动
  - 宿主构建通过且没有内部 package 导入
---

# 设备预览与工作台扩展
