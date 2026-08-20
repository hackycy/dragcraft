---
id: layout
workflows:
  - layout
task: 为页面加入固定页头、正文、Tab 栏和浮层操作，让 Designer 通过 PresentationFrame、DesignerViewportPortal 与 useSurfaceReservation 保持现有交互；同时验证普通流和 viewport Preview 的 NodeHost 几何、margin 命中与 selection 合约，并让独立 Vue Runtime 按 DocumentSchema 和稳定 type 自主解释展示。
evidence:
  - DocumentSchema 结构、MaterialDefinition.presentation、PresentationFrame、DesignerViewportPortal 与 useSurfaceReservation 的公开声明
  - layout resources、布局指南、Guide Project 和 Playground 的展示实现
boundary:
  - Schema 只保存节点、唯一 owner 和 owner 内顺序，不保存空间策略、布局或几何字段
  - Designer 的挂载与几何由 Frame/Reservation seam 拥有，生产 Runtime 自主解释 Schema，不复用 Designer Presentation
  - NodeHost 是实际命中和 mask 几何；root-segment 只是不可命中的 root-plane 视觉层，不能扩大点击范围
  - viewport Frame 只挂载 framed root NodeHost；Region child 留在 container Preview DOM，Frame 不得将 NodeHost 扩张成全屏层
verification:
  - root Text 与 Region Text 的 content margin 会撑开 NodeHost，container margin 保持外部间距，margin 留白点击仍选中节点
  - Navbar、Tab 栏和 floating action 的 NodeHost 与 Preview rect 一致；root-segment 全宽只跟随实际高度，container selection 严格贴合 NodeHost
  - framed container 的 Region child 不会重复 Teleport；resize、滚动、设备切换和 reservation 更新后 NodeHost、Preview 与 selection 仍同步，按钮外正文点击不被透明层拦截
  - 测试继续覆盖 root/region 顺序、Frame/Portal 挂载、Device Frame 裁剪、reservation 和未知/headless 恢复
  - 生产 Runtime 只导入纯 Schema 与本地物料策略，不导入 Designer Presentation 或内部几何类型
  - 三个 Playground 模板和 Guide Project 没有重复/丢失节点、交互遮挡或控制台错误
---

# PresentationFrame 与独立 Runtime 展示
