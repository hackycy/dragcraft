---
id: widgets
workflows:
  - widgets
  - layout
status: passed
inputDigest: sha256:347c3a93c5dd182df433499d10a9192ece023798018b7329ed8ff392bf70f245
executedAt: "2026-08-20T09:14:20Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - MaterialDefinition、Authoring Policy、PresentationFrame 与 viewport 布局的公开声明
  - Schema 托管页头、单一 material 定义、Frame 与 margin/selection regression 示例
verification:
  - policy 覆盖创建、复制、移动、删除与更新的可观察结果
  - root Frame 只包裹完整 NodeHost；content margin 的命中/mask 跟随实际几何，root selection 不扩大点击范围
---

# Schema 托管业务物料

参考 Agent 以 widgets 为主并加载 layout。`MaterialDefinition.authoring` 对 Schema 托管页头固定创建与复制边界；Frame 与 Preview 根元素负责 viewport 定位，拒绝路径不写入 DocumentSchema 或 history。
