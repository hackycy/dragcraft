---
id: layout
workflows:
  - layout
status: passed
inputDigest: sha256:81475baac9939995d61aa1d885e4b79b7c11ca1b49fef6f23c51a7f989f317f5
executedAt: "2026-08-20T09:14:20Z"
runner:
  agent: Codex
  model: GPT-5
evidence:
  - DocumentSchema 结构、MaterialDefinition.presentation、PresentationFrame、DesignerViewportPortal 与 useSurfaceReservation 的公开声明
  - layout resources、更新后的布局指南、Guide Project 和 Playground 的 viewport/margin 展示实现
verification:
  - root/Region content margin、container margin、margin 留白命中与 NodeHost/Preview rect 均有回归覆盖
  - Navbar、Tab 栏、floating action、framed container、resize/scroll/reservation 与 root/container selection 均保持正确几何
---

# PresentationFrame 与独立 Runtime 展示

参考 Agent 只选择 layout。Designer 以 Schema owner/order 渲染 NodeHost，通过 PresentationFrame、DesignerViewportPortal 和 useSurfaceReservation 处理设计态几何；NodeHost 仍是实际命中和 mask 范围，root selection 只是独立视觉段，宿主 Runtime 不复用设计态 Presentation。
