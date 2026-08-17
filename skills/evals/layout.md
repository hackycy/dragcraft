---
id: layout
workflows:
  - layout
task: 为页面加入固定页头、正文和浮层操作，让 Designer 通过 PresentationFrame 与 Surface Reservation 保持现有交互，并让独立 Vue 运行时按 DocumentSchema 和稳定 type 自主解释展示。
evidence:
  - DocumentSchema 结构、MaterialDefinition.presentation、PresentationFrame 与 Surface Reservation 的公开声明
  - layout resources、布局指南、Guide Project 和 Playground 的展示实现
boundary:
  - Schema 只保存节点、唯一 owner 和 owner 内顺序，不保存空间策略、布局或几何字段
  - Designer 的挂载与几何由 Frame/Reservation seam 拥有，生产 Runtime 自主解释 Schema，不复用 Designer Presentation
verification:
  - 测试覆盖 root/region 顺序、Frame 挂载、Device Frame 裁剪、reservation 和未知/headless 恢复
  - 生产 Runtime 只导入纯 Schema 与本地物料策略，不导入 Designer Presentation 或内部几何类型
  - 三个 Playground 模板和 Guide Project 没有重复/丢失节点、交互遮挡或控制台错误
---

# PresentationFrame 与独立 Runtime 展示
