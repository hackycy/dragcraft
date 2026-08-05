# 布局体系的验证与一致性契约

Status: resolved
Type: grilling
Blocked by: 03, 04, 05, 06, 07, 08

## Question

确定新布局体系的可验证不变量、诊断分类和 conformance 测试边界：节点唯一归属、只渲染一次、顺序稳定、容器约束、纯数据解析、Designer 展示、Web 几何适配、公共接口和跨平台 Schema 交付分别由哪个 interface 保证，以及如何作为直接替换现有体系的验收标准；外部消费端的 renderer 正确性不属于 Dragcraft 测试范围。

## Answer

验证体系遵循“一个不变量、一个执行 owner、一个权威测试面”。上层可以验证结果是否正确传递，但不能重新实现下层规则：

| 不变量 | 唯一执行 owner | 权威测试 interface |
| --- | --- | --- |
| 纯 JSON 解码、节点唯一归属、引用完整性 | Schema Structure Resolver | `resolveSchema()` |
| type、container capability、region 集合与约束 | Resolver / Schema Editor | `resolveSchema()` / `applySchemaOperation()` |
| move/remove/unwrap/batch 原子性 | Schema Editor | `applySchemaOperation()` |
| Policy、提交、selection 修复与 history 协调 | Authoring Engine | `execute()` / `undo()` / `redo()` |
| 每个节点只创建一个 NodeHost、root/region 顺序 | ApplicationSurface | Vue 集成测试 |
| Frame、Plane、Reservation、拖放与交互几何 | Web Designer | 产品化 playground 人工验收 |
| 公共导出白名单与接入类型 | `@dragcraft/designer` package | 消费者 typecheck 与 package exports 测试 |
| 纯数据跨平台交付 | `exportSchema()` | JSON round-trip 测试 |

反馈分为三个独立生命周期，不能相互升级或覆盖：

- `SchemaDiagnostic` 只描述 decode、structure 和 definition，决定 `ready/degraded/conflicted/rejected` 文档状态并通过 `designer.document` 公开。
- `PresentationDiagnostic` 只描述当前 Designer 展示会话，例如缺失/重复 RegionOutlet、Frame slot 错误或 region child 非法 portal；它由框架 recovery UI 展示，不改变合法文档状态。
- `AuthoringRejection` 只属于一次 Action 结果，例如 policy 拒绝、锚点失效或 region 容量不允许；它不进入持久文档诊断。
- 重复 material type、visual 缺少 preview 等静态宿主配置错误继续抛 `DesignerConfigurationError`。

Core conformance 同时使用确定性表格测试与有界属性测试。表格测试锁定四态解析、diagnostic code、JSON Pointer、稳定排序和每个结构操作的边界语义；使用 `fast-check` 生成合法一层文档与操作序列，验证输入不变、每节点唯一 owner、引用完整、容器只在 root、region child 非容器、owner 顺序一致、拒绝无部分结果、batch 原子且 committed 结果可重新解析。失败必须输出可重放 seed，CI case 数固定有上限，不进行无界 fuzz。

Authoring Engine 集成测试覆盖 Action -> Policy -> Schema Operation -> commit 的单通道，确认 no-op/rejected 不写 history、batch 只写一条、undo/redo 只移动快照游标、undo 后提交裁剪 redo 分支，以及 `maxHistoryEntries` 默认 50、`0` 禁用和容量裁剪。诊断测试同时覆盖默认 200、硬上限 2000、稳定截断与不保留 rejected 原始输入。

Vue/happy-dom 集成测试只覆盖浏览器几何之外的结构职责：MaterialDefinition 选择 visual/headless/unknown；一个 Schema node 只产生一个 NodeHost；root 和 region 按真实结构顺序挂载；每个 container region 恰有一个 Outlet；缺失/重复 Outlet 进入 recovery；toolbar/action 生成正确 Authoring Action；文档四态与三类反馈按各自通道传递。

不新增 Playwright 或自动浏览器几何 conformance。Web 几何与现有交互通过三个必须重做的产品化 playground 模板人工验收，不建立合成测试实验室：

- 商城首页覆盖 navbar、bottom bar、FAB、长页面滚动和顶部/底部 Reservation。
- 内容详情覆盖单 region 容器、三 region 异形容器、root/region 间移动和区域内排序。
- 商品详情覆盖普通内容、固定购买栏、浮层 dialog 和 Device Frame 切换。
- 真实页面加入一个 Headless 功能物料；Unknown、非法 Schema 与 presentation recovery 可通过导入场景人工检查，不污染默认产品页面。

人工清单必须确认 toolbar、selection、拖放反馈保持现有体验；Document/Viewport 节点滚动正确；Preview 受 Device Frame 裁剪而 Interaction Plane 不被裁剪；root/region 移动和结构树一致；撤销重做、模板切换、导入导出正常；不存在重复/丢失节点、异常滚动条或业务层遮挡交互层。人工确认是 Web 几何验收的权威结果，CI 不代替它。

公共消费者契约测试只从 `@dragcraft/designer`、`@dragcraft/device-frames` 和 `@dragcraft/fields-*` 接入，覆盖最小 visual、headless、一层 container、PresentationFrame、空白文档、四态导入、字段 adapter 与 Device Frame。负向测试确保 Engine、Command、ResolvedDocument、SchemaOperation、ComponentMap、WidgetDefinition、RootRenderer、NodeHost 和几何内部类型不再导出；package exports、类型声明、CSS subpath 与公开包依赖扫描保持一致，也不保留 `DesignerSchema` 等兼容 alias。

跨平台 conformance 终止于 `exportSchema()`：导出必须是与内部快照隔离、可 JSON stringify/parse 并无损重新导入的普通数据；节点 ID、type、props、owner、owner 顺序、unknown 节点与 regions 都保持一致。只检查框架拥有的文档字段不含 placement、geometry、reservation、Vue/DOM 或可执行值，不扫描开放业务 props 的字段名。Flutter、原生和外部 Web 的模型、未知 type 策略与 renderer 正确性不由 Dragcraft 验证，也不提供 JSON Schema artifact、SDK 或代码生成。

最终重构只能以单轨状态合并：新 DocumentSchema、Resolver、Schema Editor、Authoring Engine、ApplicationSurface 与 MaterialDefinition 全链路接通，三个 playground 模板及架构文档同步重写，Core/Designer/公共消费者测试全部通过，且 `pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test` 通过。最终代码、文档、examples 和 playground 必须删除 LayoutPlan/NodeLayout、flow/chrome/layer placement、root.children、container variant/migration、WidgetMeta + ComponentMap 双注册、旧 command/runtime 公共面，以及迁移、兼容 alias、双读或双写；开发分支可以分步施工，但最终合并结果不能保留新旧两套体系。
