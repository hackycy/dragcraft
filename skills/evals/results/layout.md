---
id: layout
workflows:
  - layout
status: passed
inputDigest: sha256:2c033285bc24acf1603ecbceb4d5bf11a1e60609fb34180ebb4509be415e03ad
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - MaterialDefinition Presentation 布局与样式公开声明
  - 初始 DocumentSchema、Runtime 布局投影、RuntimePage 与容器示例
verification:
  - Runtime 布局测试覆盖 flow、chrome、layer、可见性和固定 inset
  - browser smoke 覆盖 Device Frame 裁剪、根节点排序与浮层投影
---

# 布局投影与参考运行时

参考 Agent 只选择 layout。Designer Presentation 按 flow region、chrome edge 和 layer 分域稳定排序，并把 container、content、surface 样式交给各自所有者；宿主 Runtime 独立解释 DocumentSchema，不复用设计态 Presentation。
