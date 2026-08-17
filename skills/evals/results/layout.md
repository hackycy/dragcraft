---
id: layout
workflows:
  - layout
status: passed
inputDigest: sha256:921ee2aa788fd6ac211d5471f6b68b8ac12975dc2853c6cb4fdd8c5704de2ecc
executedAt: "2026-08-11T06:57:27Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - DocumentSchema 结构、MaterialDefinition.presentation、PresentationFrame 与 Surface Reservation 的公开声明
  - layout resources、布局指南、Guide Project 和 Playground 的展示实现
verification:
  - 测试覆盖 root/region 顺序、Frame 挂载、Device Frame 裁剪、reservation 和未知/headless 恢复
  - browser smoke 覆盖三模板交互、独立 Runtime 展示和控制台清洁
---

# PresentationFrame 与独立 Runtime 展示

参考 Agent 只选择 layout。Designer 以 Schema owner/order 渲染 NodeHost，通过 PresentationFrame、mount plane 和 reservation 处理设计态几何；宿主 Runtime 独立解释 DocumentSchema 和稳定 type，不复用设计态 Presentation。
